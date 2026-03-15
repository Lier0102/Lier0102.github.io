---
title: "[UTCTF] Fortune Teller writeup"
date: 2026-03-15 18:29:00
categories: Essay
tags: [CTF]
---

# UTCTF - Fortune Teller

## 문제 개요

- **카테고리**: 암호학 (Cryptography)
- **주제**: Linear Congruential Generator (LCG) 취약점

### 주어진 정보 (`lcg.txt`)

```
x_(n+1) = (a * x_n + c) % m

m = 4294967296 (2^32)
a, c 는 미지수

output_1 = 4176616824
output_2 = 2681459949
output_3 = 1541137174
output_4 = 3272915523

ciphertext (hex) = 3cff226828ec3f743bb820352aff1b7021b81b623cff31767ad428672ef6
```

FLAG는 `output_5`를 4바이트 반복 키로 사용해서 XOR 암호화되어 있다.

---

## 배경 지식

### LCG (선형 합동 생성기)?

LCG는 다음 점화식으로 난수를 생성하는 알고리즘.

```
x_(n+1) = (a * x_n + c) % m
```

- `m`: 모듈러스 (2^32)
- `a`: 곱셈 상수 (multiplier)
- `c`: 덧셈 상수 (increment)
- `x_0`: 초기값 (seed)

구현이 단순하고 빠르지만, **암호학적으로 안전하지 않다.**  
왜냐하면 출력값 몇 개만 알면 `a`와 `c`를 역산할 수 있어서, 이후 모든 출력값을 예측할 수 있거든.

---

### 모듈러 역원?

`a * x ≡ 1 (mod m)` 을 만족하는 `x`를 `a`의 모듈러 역원

- `gcd(a, m) = 1` 일 때만 역원이 존재한다.
- Python 3.8+ 에서는 `pow(a, -1, m)` 으로 바로 구할 수 있다.

---

## 풀이 원리

### Step 1: `a` 복원

연속된 두 출력값의 차를 보면:

```
x_(n+1) = a * x_n + c  (mod m)
x_(n+2) = a * x_(n+1) + c  (mod m)
```

두 식을 빼면 `c`가 사라져:

```
x_(n+2) - x_(n+1) ≡ a * (x_(n+1) - x_n)  (mod m)
```

즉:

```
a ≡ (x3 - x2) * inverse(x2 - x1, m)  (mod m)
```

역원이 존재하려면 `gcd(x2 - x1, m) = 1` 이어야 해.  
이 문제에서는 `diff1 = (x2 - x1) % m = 2799810421` 이고  
`gcd(2799810421, 2^32) = 1` 이라서 역원이 존재한다.

---

### Step 2: `c` 복원

`a`를 구했으면 `c`는 간단:

```
c ≡ x2 - a * x1  (mod m)
```

---

### Step 3: `output_5` 예측

`a`, `c`, `m`을 모두 알았으니 `x5`는:

```
x5 = (a * x4 + c) % m
```

---

### Step 4: XOR 복호화

`output_5`를 big endian 4바이트로 변환해서 반복 키로 사용:

```
plaintext[i] = ciphertext[i] XOR key[i % 4]
```

---

## 풀이 코드

```python
import struct

m = 4294967296  # 2^32
outputs = [4176616824, 2681459949, 1541137174, 3272915523]
x1, x2, x3, x4 = outputs

# Step 1: a 복원
# a ≡ (x3 - x2) * inverse(x2 - x1, m) (mod m)
diff1 = (x2 - x1) % m
diff2 = (x3 - x2) % m

a = (diff2 * pow(diff1, -1, m)) % m

# Step 2: c 복원
# c ≡ x2 - a * x1 (mod m)
c = (x2 - a * x1) % m

# Step 3: 검증
assert (a * x1 + c) % m == x2
assert (a * x2 + c) % m == x3
assert (a * x3 + c) % m == x4

# Step 4: output_5 예측
x5 = (a * x4 + c) % m

# Step 5: XOR 복호화
ciphertext_hex = '3cff226828ec3f743bb820352aff1b7021b81b623cff31767ad428672ef6'
if len(ciphertext_hex) % 2 != 0:
    ciphertext_hex = '0' + ciphertext_hex

ciphertext = bytes.fromhex(ciphertext_hex)

# output_5를 big endian 4바이트 키로 변환
key = struct.pack('>I', x5)

# 4바이트 반복 키로 XOR
plaintext = bytes([ciphertext[i] ^ key[i % 4] for i in range(len(ciphertext))])

print(f'a         = {a}')
print(f'c         = {c}')
print(f'output_5  = {x5}')
print(f'key (hex) = {key.hex()}')
print(f'FLAG      = {plaintext.decode()}')
```

---

## 실행 결과

```
a         = 3355924837
c         = 2915531925
output_5  = 1233863684
key (hex) = 498b4404
FLAG      = utflag{pr3d1ct_th3_futur3_lcg}
```

---

## FLAG

```
utflag{pr3d1ct_th3_futur3_lcg}
```

---

## 핵심 포인트 정리

| 단계 | 내용 |
|---|---|
| `a` 복원 | 연속 출력값의 차분으로 `c` 제거 후 모듈러 역원으로 나눗셈 |
| `c` 복원 | `a` 알면 단순 대입으로 바로 계산 |
| `output_5` 예측 | LCG 점화식에 대입 |
| 복호화 | output_5를 big endian 4바이트 키로 XOR |

---

## LCG가 왜 암호학적으로 취약한가

1. **출력값 3개면 `a`, `c` 완전 복원 가능**  
   -> 이후 모든 출력값 예측 가능

2. **역방향 계산도 가능**  
   -> `a`의 역원을 구하면 이전 출력값도 역산 가능

3. **상태 공간이 작음**  
   -> `m = 2^32`이면 최대 42억 개의 상태만 존재해서 brute force도 가능

### 실제 암호학에서는?

LCG는 시뮬레이션이나 게임 등 **통계적 무작위성**이 필요한 곳에만 써야 해.  
암호학적으로 안전한 난수가 필요하다면 반드시 **CSPRNG (Cryptographically Secure PRNG)**

- Python: `secrets` 모듈
- Linux: `/dev/urandom`
- 표준: **ChaCha20**, **AES-CTR** 기반 PRNG

---

`LLM` 돌려서 겨우 풀었다. 알고리즘을 모른다면 풀 수 없으리라 판단,  
따라서 이번 롸업 정리가 모두 끝나면 차례대로 공부하고 따로 풀어볼 예정이다.

## 관련 개념 더 공부하기

- **확장 유클리드 알고리즘**: 모듈러 역원을 구하는 원리
- **Berlekamp-Massey 알고리즘**: LFSR 계수 복원 (LCG의 사촌 격)
- **Lattice Attack**: 여러 LCG 출력값으로 더 효율적으로 파라미터를 복원하는 고급 기법
- **CSPRNG**: 실제 암호학에서 사용하는 안전한 난수 생성기