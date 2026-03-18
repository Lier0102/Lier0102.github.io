---
title: "[DREAMHACK] hash browns writeup"
date: 2026-03-018 21:20:00
categories: Essay
tags: [writeup]
---
# hash-browns
---

## 개요

| 항목 | 내용 |
|------|------|
| 문제명 | hash-browns |
| 카테고리 | Reverse Engineering |
| 아키텍처 | x86-64 (Linux ELF) |
| 핵심 알고리즘 | MD5 |
| 풀이 방법 | 해시 역산 (Brute Force) |

---

## 분석

### 함수 구조 파악

Ghidra로 바이너리를 열어 함수 목록을 확인했다.  
주요 함수는 다음과 같다.

| 함수 주소 | 역할 |
|-----------|------|
| `FUN_00101209` | MD5 컨텍스트 초기화 (MD5 Init) |
| `FUN_0010125c` | MD5 업데이트 (MD5 Update) |
| `FUN_001013e7` | MD5 파이널라이즈 (MD5 Final / padding) |
| `FUN_001015b3` | MD5 압축 함수 (내부 라운드 연산) |
| `FUN_001022b9` | 메인 로직 << 입력 수신, 검증, Flag 출력 |
<!--more-->

### 메인 로직 (`FUN_001022b9`)

```c
// 하드코딩된 target hash 배열 (9개 × 16바이트 = 144바이트)
local_1a8[0] = 0xfe5d3a093968d02b;
local_1a8[1] = 0xba0aa367c2862eae;
// ... (총 18개의 uint64)

// 입력을 3글자씩 끊어 9번 반복 검증
for (local_224 = 0; local_224 <= 8; local_224++) {
    FUN_00101209(local_218);                          // MD5 Init
    FUN_0010125c(local_218, input + local_224*3, 3); // MD5 Update (3바이트)
    FUN_001013e7(local_218);                          // MD5 Final

    // 결과 16바이트를 target hash와 비교
    if (memcmp(result, &local_1a8[local_224*2], 0x10) != 0) {
        puts("Wrong!");
        return 1;
    }
}
// 모두 통과하면
printf("Correct! Flag is %s\n", input);
```

핵심 로직 요약:

1. 사용자 입력을 **3글자씩** 총 **9개 블록**으로 분할
2. 각 블록에 대해 **MD5** 해시 계산
3. 계산 결과를 바이너리 내 **하드코딩된 해시값**과 `memcmp`로 비교
4. 9개 블록 **모두 일치**하면 `Correct! Flag is {입력값}` 출력

### MD5 구현 확인

`FUN_00101209`의 초기화 상수를 보면 MD5 표준 초기값임을 알 수 있다.

```c
param_1[2] = 0x67452301;  // A
param_1[3] = 0xefcdab89;  // B
param_1[4] = 0x98badcfe;  // C
param_1[5] = 0x10325476;  // D
```

이는 RFC 1321에 정의된 MD5 초기 해시값과 일치한다.

---

## 풀이

### Target Hash 추출

`local_1a8` 배열의 `uint64` 값들을 리틀 엔디안 바이트 시퀀스로 변환하면  
각 블록의 MD5 다이제스트 16바이트를 얻을 수 있다.

```python
import struct

raw = [
    0xfe5d3a093968d02b, 0xba0aa367c2862eae,
    0x8bea2ada9e26604f, 0x2e6f41c96dcf5224,
    0x7fd91bd2949b75f3, 0x5b1ed8e6072f3a6,
    0xc94045c6d4887611, 0x9d43df6df6b94d95,
    0xb9a8a83c8ac08d80, 0x6d78e80376518464,
    0xe81a20f2023c2d0,  0x2e41eae69d89f186,
    0x425c831dd2a3e5fd, 0x82788dbbdc4100ec,
    0x6d0fee8d3901dd20, 0xebe82a0a41e5d783,
    0x2afa26414b72e506, 0xd1848e9c21d114d,
]

def u64_to_bytes(v):
    return struct.pack('<Q', v)

target_hashes = []
for i in range(0, len(raw), 2):
    digest = u64_to_bytes(raw[i]) + u64_to_bytes(raw[i+1])
    target_hashes.append(digest.hex())
```

### 3글자 Brute Force

입력이 **3글자**로 고정되어 있으므로 printable ASCII 범위 내에서 전수 탐색이 가능하다.  
조합 수: `95^3 = 857,375` — 충분히 빠르게 탐색 가능하다.

```python
import hashlib
import itertools
import string

chars = string.printable.replace('\n', '').replace('\r', '')

for target_hex in target_hashes:
    target_bytes = bytes.fromhex(target_hex)
    for combo in itertools.product(chars, repeat=3):
        candidate = ''.join(combo).encode()
        if hashlib.md5(candidate).digest() == target_bytes:
            print(''.join(combo))
            break
```

### 결과

| 블록 | MD5 (hex) | 복원된 3글자 |
|------|-----------|-------------|
| 0 | `2bd06839093a5dfeae2e86c267a30aba` | `DH{` |
| 1 | `4f60269eda2aea8b2452cf6dc9416f2e` | `m-d` |
| 2 | `f3759b94d21bd97fa6f372608eedb105` | `-5_` |
| 3 | `117688d4c64540c9954db9f66ddf439d` | `1s_` |
| 4 | `808dc08a3ca8a8b96484517603e8786d` | `vu1` |
| 5 | `d0c223200fa2810e86f1899de6ea412e` | `n-e` |
| 6 | `fde5a3d21d835c42ec0041dcbb8d7882` | `r-4` |
| 7 | `20dd01398dee0f6d83d7e5410a2ae8eb` | `b1e` |
| 8 | `06e5724b4126fa2a4d111dc2e948180d` | `~!}` |

---

## Flag

```
DH{m-d-5_1s_vu1n-er-4b1e~!}
```

---

## 결론

이 문제는 MD5를 직접 구현하여 3글자 단위로 입력을 검증하는 crackme다.  
MD5는 충돌 취약점으로 잘 알려져 있지만, 이 문제에서의 핵심 취약점은 **짧은 입력에 대한 취약성**이다.  
3글자(24비트) 입력공간은 `95^3 ≈ 85만` 개에 불과하므로, 단순 brute force로 1초 내에 모든 블록을 역산할 수 있다.