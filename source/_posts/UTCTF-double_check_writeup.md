---
title: "[UTCTF] Double Check writeup"
date: 2026-03-15 18:29:00
categories: Essay
tags: [CTF]
---

# UTCTF - Double Check

---

## 📋 문제 정보

| 항목 | 내용 |
|------|------|
| **대회** | UTCTF |\
| **카테고리** | Web / OSINT |
| **난이도** | Easy |
| **Flag** | `utflag{n07h1n6_70_h1d3}` |

---

## 📝 문제 설명

> We're planning on deploying some new static sites for our officers. We've cloned a template from Hugo's Static Site Generator (SSG). Can you make sure that our website is clean before it's deployed?
>
> https://github.com/Jarpiano/utctf-profile

Hugo SSG 템플릿을 클론해서 정적 사이트를 배포하려는데, 배포 전에 코드가 "깨끗한지" 확인해달라는 문제다.

---

## 🔍 풀이 과정

### Step 1. 파일 구조 파악

다운로드한 프로젝트의 전체 파일을 확인한다.

```/dev/null/terminal.sh#L1-2
find . -type f | sort
```

주요 디렉토리 구조:

```/dev/null/tree.txt#L1-15
utctf-profile-main/
├── archetypes/
├── assets/
│   ├── js/
│   └── scss/
├── docs/
├── exampleSite/
│   ├── content/
│   └── static/
│       └── images/
│           ├── avatar.jpg
│           └── N90.jpg   <-- 수상한 파일
├── layouts/
├── static/
└── hugo.toml
```

---

### Step 2. 명백한 플래그 탐색 (실패)

파일 내부에 직접 플래그가 있는지 grep으로 탐색한다.

```/dev/null/terminal.sh#L1-2
grep -r "utflag\|flag{" . --include="*.toml" \
  --include="*.html" --include="*.md" --include="*.js"
```

**결과: 아무것도 없음.** 파일 내부에 직접 숨겨진 플래그는 없다.

---

### Step 3. 이미지 파일 포렌식 시도 (힌트 발견)

`N90.jpg`라는 일반적이지 않은 이름의 파일이 존재했다. EXIF 데이터를 확인한다.

```/dev/null/terminal.sh#L1-2
file exampleSite/static/images/N90.jpg
xxd exampleSite/static/images/N90.jpg | head -50
```

EXIF 설명에는 허블 망원경으로 찍은 성운 사진(N90 성운)에 대한 설명만 있었다. **스테가노그래피는 아니었다.** → 이미지는 단순히 예제 사이트의 배경 이미지였음.

---

### Step 4. 로컬 Git 히스토리 확인 (실패)

```/dev/null/terminal.sh#L1-2
git log --oneline
# No git history
```

다운로드한 zip 파일에는 `.git` 폴더가 없었다. 하지만 문제에서 **GitHub 링크**를 직접 제공하고 있다.

> ⚠️ **핵심 포인트**: 문제 설명에 GitHub 링크가 있다는 건, **원격 레포지토리의 히스토리**를 확인하라는 힌트임;

---

### Step 5. GitHub 커밋 히스토리 분석

`https://github.com/Jarpiano/utctf-profile/commits/main` 에서 커밋 로그를 확인한다.

전체 커밋 중 상위 3개가 문제에서 직접 추가한 커밋이었다:

| 커밋 해시 | 메시지 | 날짜 |
|-----------|--------|------|
| `ff2ac47` | **updated site** | Mar 12, 2026 |
| `a1546af` | **added key file to integrate with AWS** ⚠️ | Mar 12, 2026 |
| `b5b893f` | new clone | Mar 12, 2026 |

**"added key file to integrate with AWS"** << 이 커밋 메시지가 결정적인 단서다.

---

### Step 6. 의심 커밋 내용 확인

`https://github.com/Jarpiano/utctf-profile/commit/a1546af`

```/dev/null/diff.txt#L1-8
# Commit a1546af
# "added key file to integrate with AWS"

static/fonts/secret-keys/AWS-key.txt

@@ -0,0 +1 @@
+ utflag{n07h1n6_70_h1d3}
```

**플래그가 `static/fonts/secret-keys/AWS-key.txt`에 커밋되어 있었다!**

---

### Step 7. 삭제 커밋 확인

`https://github.com/Jarpiano/utctf-profile/commit/ff2ac47`

```/dev/null/diff.txt#L1-8
# Commit ff2ac47
# "updated site"

static/fonts/secret-keys/AWS-key.txt

@@ -1 +0,0 @@
- utflag{n07h1n6_70_h1d3}
```

다음 커밋에서 해당 파일을 삭제했지만, **Git은 히스토리를 영구 보존**하기 때문에 이전 커밋에서 내용을 그대로 볼 수 있다.

---

## 🚩 Flag

```/dev/null/flag.txt#L1-1
utflag{n07h1n6_70_h1d3}
```

플래그를 leet speak로 해석하면: **"n07h1n6 70 h1d3"**

---

**왜 위험한가?**

Git은 모든 커밋을 **영구적으로 기록**한다. 파일을 삭제해도 이전 커밋 객체는 `.git/objects/`에 그대로 남아 있으며, 로컬뿐 아니라 GitHub 같은 **공개 원격 저장소**에 push된 경우에는 전 세계 누구나 조회할 수 있다.

---

### 해결방법

**방법 1. `git filter-branch`로 히스토리 재작성**
```/dev/null/fix.sh#L1-6
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch static/fonts/secret-keys/AWS-key.txt" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

**방법 2. `git-filter-repo` 사용 (권장)**
```/dev/null/fix.sh#L1-4
pip install git-filter-repo
git filter-repo --path static/fonts/secret-keys/AWS-key.txt --invert-paths
git push origin --force --all
```

**방법 3. GitHub 레포 완전 삭제 후 재생성**
- 가장 확실한 방법
- 기존 fork/clone에는 여전히 남을 수 있으므로, **시크릿 키는 반드시 즉시 폐기(revoke)** 해야 한다

## Summary

> **"Git에 제발 숨길 거 올리지 마라"**

1. **파일 삭제 커밋 != 정보 삭제**
2. **공개 레포에는 절대 시크릿을 커밋하지 않는다**
3. 문제 설명의 GitHub 링크처럼 **OSINT 단서를 놓치지 않는다**
4. git history

마지막 교훈:

# OSINT 하지마라. 그딴 거 하는 거 아니다.