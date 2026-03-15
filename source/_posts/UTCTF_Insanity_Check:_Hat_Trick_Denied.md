---
title: "[UTCTF] Insanity Check: Hat Trick Denied writeup"
date: 2026-03-15 18:29:00
categories: Essay
tags: [CTF]
---
# UTCTF - Insanity Check: Hat Trick Denied

**대회:** UTCTF 2026  
**카테고리:** Misc, OSINT  
**점수:** 898점 (102 solves)(풀 때 시점)  
**플래그:** `utflag{I'm_not_a_robot_I_promise}`

---

## 문제 설명

> After a gap year, the sequel to "Insanity Check: Redux" and "Insanity Check: Reimagined" is finally here!
> 
> The flag is in CTFd, but, as always, you'll have to work for it.
> 
> (This challenge does not require any brute-force -- as per the rules of the competition, brute-force tools like dirbuster are not allowed, there is a clear solution path without it if you know where to look.)
> 
> By Caleb (@eden.caleb.a on discord)

별도의 첨부 파일이나 서버 주소 없이, **utctf.live 사이트 자체**가 문제의 무대다.
<!--more-->

---

## 풀이 과정

### 1단계: robots.txt 확인

CTF 사이트를 탐색할 때 가장 먼저 확인해야 할 것 중 하나가 `robots.txt`다.

```
$ curl https://utctf.live/robots.txt

User-agent: *
Disallow: /admin
Disallow: /2065467898
Disallow: /3037802467
```

`/admin` 외에 `/2065467898`, `/3037802467`이라는 수상한 경로 두 개가 숨겨져 있었다.

---

### 2단계: 숨겨진 페이지 접근

브라우저(비로그인)로 접속하면 404가 떴지만, **로그인 쿠키를 포함하면 200이 반환**됐다.

```bash
curl "https://utctf.live/2065467898" \
  -H "Cookie: session=..." \
  --max-time 10 -s -o /dev/null -w "%{http_code}"
# → 200

curl "https://utctf.live/3037802467" \
  -H "Cookie: session=..." \
  --max-time 10 -s -o /dev/null -w "%{http_code}"
# → 200
```

즉, 이 페이지들은 **로그인한 사용자에게만 접근 가능한 CTFd 커스텀 페이지**였다.

---

### 3단계: HTML 주석에서 숫자 배열 발견

각 페이지의 HTML을 curl로 받아보면, 겉으로는 "File not found / 404 Not Found"처럼 보이지만, `<h1>` 태그 안에 **HTML 주석으로 숫자 배열이 숨겨져 있었다.**

**`/2065467898` 페이지:**

```html
<h1>File not found</h1>
<!-- 2, 7, 9, 7, 8, 13, 17, 39, 85, 4, 57, 4, 93, 30, 104, 27, 44, 23, 89, 8, 30, 68, 107, 112, 54, 0, 30, 11, 2, 92, 66, 23, 31 -->
```

**`/3037802467` 페이지:**

```html
<h1>File not found</h1>
<!-- 119, 115, 111, 107, 105, 106, 106, 110, 114, 105, 102, 106, 50, 106, 55, 122, 115, 101, 54, 106, 113, 48, 52, 57, 105, 112, 108, 100, 111, 53, 49, 114, 98 -->
```

두 번째 배열의 값들이 **출력 가능한 ASCII 범위(50~122)**에 있다는 점에서 XOR 연산을 의심할 수 있다.

---

### 4단계: XOR 복호화

두 배열을 XOR하면 플래그가 나온다.

```python
a = [2, 7, 9, 7, 8, 13, 17, 39, 85, 4, 57, 4, 93, 30, 104, 27, 44, 23, 89, 8, 30, 68, 107, 112, 54, 0, 30, 11, 2, 92, 66, 23, 31]
b = [119, 115, 111, 107, 105, 106, 106, 110, 114, 105, 102, 106, 50, 106, 55, 122, 115, 101, 54, 106, 113, 48, 52, 57, 105, 112, 108, 100, 111, 53, 49, 114, 98]

result = [x ^ y for x, y in zip(a, b)]
print(''.join(chr(c) for c in result))
```

```
utflag{I'm_not_a_robot_I_promise}
```

---

## 요약

|단계|내용|
|---|---|
|1|`robots.txt`에서 숨겨진 경로 `/2065467898`, `/3037802467` 발견|
|2|로그인 쿠키 포함 시 200 응답 확인|
|3|각 페이지의 HTML 주석에서 숫자 배열 추출|
|4|두 배열을 XOR → 플래그 획득|

---

## 플래그

```
utflag{I'm_not_a_robot_I_promise}
```

재밌었다.