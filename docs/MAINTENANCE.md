# ChakCare 유지보수 가이드

이 문서는 **코드를 처음 보는 사람이 혼자서 고치고, 배포하고, 문제를 찾을 수 있게** 쓴 안내서야.
키(비밀번호)는 이 문서에 적지 않았어. "어디에서 확인하는지"만 적었어.

- 서비스 주소: https://chack-care.vercel.app
- 저장소: https://github.com/tom4ttack/chack-care
- Supabase 대시보드: https://supabase.com/dashboard/project/ujirlznmlekocoibrlsw

## 목차
1. 전체 그림
2. 폴더와 파일 지도
3. Supabase 사용법
4. 앱 코드가 하는 일
5. 게이트웨이 스크립트가 하는 일
6. 비콘 설정
7. "이걸 바꾸고 싶다" 하면 어디를 고치나
8. 개발, 배포, 되돌리기
9. 문제 해결
10. 알려진 한계
11. 시연 전 체크리스트
12. 용어

---

## 1. 전체 그림

```
[비콘 DX-CP27]  ──(블루투스 방송)──▶  [게이트웨이 = 노트북의 Python 스크립트]
  iBeacon: 누구인지(Minor)                  "N초 동안 신호 없음 = 이탈"을 판정
  TLM: 배터리 전압, 온도                    상태가 바뀔 때만 서버로 전송
                                                   │ (인터넷, REST)
                                                   ▼
                                         [Supabase = 데이터베이스]
                                          events / beacon_status /
                                          receivers / alert_actions
                                                   │ (실시간 Realtime)
                                                   ▼
                                    [웹앱 React, Vercel에 배포]
                                  폰/컴퓨터 브라우저에서 경보, 지도, 처리
```

핵심 규칙은 이 세 가지야.
1. **이탈 판정은 게이트웨이가 한다.** 앱은 결과(`events`)를 보여주기만 해.
2. **`events`에는 "상태가 바뀔 때"만 한 줄씩 쌓인다.** (exit, present, low_battery)
3. **사람 이름(`subject`) 글자가 비콘, DB, 앱에서 모두 같아야 연결된다.** (예: `김서준`)

---

## 2. 폴더와 파일 지도

```
chack-care/
├─ docs/MAINTENANCE.md         이 문서
├─ index.html                  웹 페이지 뼈대 (제목, 아이콘)
├─ .figma/make/site.json       페이지 제목, 설명, 미리보기 설정 (카톡 미리보기 등)
├─ vercel.json                 모든 주소를 index.html로 보내는 설정
├─ .env                        로컬 전용 키 (깃에 안 올라감, 아래 8장)
├─ package.json                설치된 라이브러리와 명령어
└─ src/
   ├─ main.tsx                 앱 시작점
   ├─ index.css                색(mint, coral, navy...), 글꼴, 애니메이션
   ├─ App.tsx                  앱 전체 상태와 탭 연결 (가장 중요)
   ├─ types.ts                 공통 타입 (Core, Person, Reward ...)
   ├─ data.ts                  기본 데이터 (PROTECTED, 상점 목록, 리워드 도우미)
   ├─ GuardianMap.tsx          실제 지도 (Leaflet)
   ├─ lib/
   │  ├─ supabase.ts           Supabase 연결 + EventRow 타입
   │  ├─ useBeaconStatus.ts    배터리 상태 읽기 + 실시간
   │  └─ useAlertActions.ts    알림 처리 기록 읽기/쓰기 + 실시간
   ├─ components/
   │  ├─ Icon.tsx              아이콘 모음
   │  ├─ ui.tsx                배터리 아이콘, 신호 막대, 토글, 섹션 제목
   │  ├─ AlertModal.tsx        이탈 경보 모달 (AlertSheet = 공통 틀)
   │  ├─ PeopleCarousel.tsx    사람별 카드 넘겨보기 + 사람별 상태 계산
   │  └─ NotificationPanel.tsx 알림 패널, 처리 버튼, 지우기
   └─ screens/
      ├─ HomeScreen.tsx        홈
      ├─ LiveMapScreen.tsx     라이브 지도
      ├─ ReportScreen.tsx      리포트 (샘플 데이터)
      ├─ RewardScreen.tsx      리워드 (샘플 데이터)
      └─ MenuPages.tsx         메뉴 서랍과 하위 페이지 (샘플 데이터)
```

게이트웨이 스크립트는 저장소 밖이야: `C:\Users\USER1\scan_and_log_v3.py` (키가 들어 있어서 일부러 안 올렸어).

---

## 3. Supabase 사용법

### 3-1. 대시보드에서 자주 가는 곳
| 메뉴 | 하는 일 |
|---|---|
| **Table Editor** | 표를 엑셀처럼 보고, 행을 추가/수정/삭제, CSV 내보내기 |
| **SQL Editor** | SQL을 직접 실행 (조회, 삭제, 표 만들기) |
| **Database → Migrations** | 우리가 한 표 변경 이력 |
| **Database → Publications** | 실시간으로 내보낼 표 목록 (`supabase_realtime`) |
| **Logs** | API 요청과 오류 기록 (401/403/409 등 원인 찾기) |
| **Project Settings → API Keys** | 키 확인 |
| **Advisors** | 보안 경고 점검 |

### 3-2. 키 (가장 중요)
- **anon(공개용) 키**: 앱(`.env`, Vercel 환경변수)과 게이트웨이 스크립트에 쓴다. 위치: Project Settings → API Keys. 게이트웨이는 `eyJ...`로 시작하는 **Legacy anon** 키를 써야 한다 (`sb_publishable_` 키는 파이썬의 `Authorization: Bearer` 방식에서 막힐 수 있음).
- **service_role 키**: 접근 규칙을 전부 무시하는 **만능 키**. 앱, 스크립트, 깃, 메신저 어디에도 넣지 않는다.
- **키를 바꾸면** 두 군데를 같이 고친다: ① Vercel 환경변수(바꾼 뒤 재배포) ② 게이트웨이 스크립트.

### 3-3. 표 4개

**`events`** : 이탈/복귀/배터리 이벤트 이력 (한 줄 = 한 번의 상태 변화)
| 컬럼 | 설명 |
|---|---|
| `id` | 자동 번호 (큰 값일수록 최신) |
| `subject` | 사람 이름 (예: 김서준) |
| `status` | `exit`(이탈), `present`(복귀), `low_battery`(배터리 부족) |
| `receiver` | 신호를 받은 수신기 이름 (예: 3층출입구) |
| `rssi` | 신호 세기 (이탈 행은 비어 있음) |
| `ts` | 시각 (UTC로 저장) |

**`beacon_status`** : 비콘별 **최신** 배터리 (사람당 한 줄, 계속 덮어씀)
| 컬럼 | 설명 |
|---|---|
| `minor` | 비콘 번호 (기본키) |
| `subject` | 사람 이름 |
| `address` | 비콘 MAC 주소 |
| `battery_mv` | 전압 (mV, 새 CR2032는 약 3000) |
| `level` | `ok` / `warn` / `low` |
| `temp_c` | 온도 |
| `updated_at` | 마지막 갱신 시각 |

**`receivers`** : 수신기 이름과 지도 좌표
| 컬럼 | 설명 |
|---|---|
| `name` | 수신기 이름 (기본키, 스크립트의 `--receiver` 값과 같아야 함) |
| `lat`, `lng` | 위도, 경도 |
| `updated_at` | 마지막 지정 시각 |

**`alert_actions`** : 보호자가 이탈 알림에 한 처리
| 컬럼 | 설명 |
|---|---|
| `id` | 자동 번호 |
| `event_id` | 어떤 `events` 행에 대한 처리인지 (그 행이 지워지면 같이 지워짐) |
| `action` | `acknowledged`(확인함), `resolved`(처리 완료), `false_alarm`(화면 표시는 "이상 없음") |
| `ts` | 시각 |

한 이벤트에 처리가 여러 번 쌓일 수 있고, **가장 마지막 기록이 현재 상태**다.

### 3-4. 접근 규칙(RLS)의 현재 상태
모든 표에 RLS가 **켜져 있고**, 공개용 키(anon)에 이렇게 허용했다.

| 표 | 읽기 | 쓰기(추가) | 수정 | 삭제 |
|---|---|---|---|---|
| events | 가능 | 가능 | 불가 | **불가** |
| alert_actions | 가능 | 가능 | 불가 | **불가** |
| beacon_status | 가능 | 가능 | 가능 | **불가** |
| receivers | 가능 | 가능 | 가능 | **불가** |

- 앱은 **삭제를 못 한다.** 지우려면 대시보드(주인 권한)에서만 가능하다.
- 지금은 **시연용으로 느슨한 상태**다. 앱 키는 웹사이트 코드에 공개돼 있어서, 키를 아는 누구나 위 표에 쓸 수 있다. 결선 이후에는 로그인(Authentication)을 붙여 쓰기를 제한하는 게 정석이다.
- 정책 확인/변경 SQL은 3-7 참고.

### 3-5. 실시간(Realtime)
- 실시간으로 앱에 전달되는 표: `events`, `alert_actions`, `beacon_status` (등록은 `supabase_realtime`). `receivers`는 실시간이 필요 없다.
- 앱은 `events`와 `alert_actions`에서 **INSERT(새 행)만** 듣는다. 그래서 **삭제나 수정은 앱에 바로 반영되지 않고, 새로고침해야 반영된다.**
- 새 표를 만들고 실시간을 쓰려면 반드시 등록한다: `alter publication supabase_realtime add table 표이름;`

### 3-6. 데이터 보기, 지우기, 내보내기
**Table Editor (클릭)**
1. 왼쪽 **Table Editor** → 표 선택
2. 행 왼쪽 체크박스 → 위쪽 **Delete N rows**
3. 많을 때는 **Filter**로 조건을 걸고 전체 선택
4. 내보내기는 표 위쪽의 **Export → CSV**
- 주의: 표 이름 옆 `⋯` 메뉴의 **Delete table**은 표 자체를 없앤다. 쓰지 않는다.

**SQL Editor (한꺼번에)**: 먼저 `select`로 대상을 확인하고 같은 조건으로 `delete` 한다.
```sql
select * from public.events where subject = '테스트';    -- 1) 확인
delete from public.events where subject = '테스트';      -- 2) 삭제
```
- **되돌리기 어렵다.** 무료 요금제는 자동 백업이 없거나 제한적이니, 중요한 기록은 먼저 CSV로 내보낸다.
- **비콘이 멀리 나가 있는 동안엔 이탈 기록을 지우지 않는다.** 앱이 그 사람을 "안심"으로 잘못 보여준다.
- `events`를 지우면 그 이벤트의 `alert_actions`도 같이 지워진다.

### 3-7. 자주 쓰는 SQL
```sql
-- 최근 이벤트 (한국 시간)
select id, subject, status, receiver, rssi, ts at time zone 'Asia/Seoul' as 시각
from public.events order by id desc limit 30;

-- 이탈에서 복귀까지 걸린 시간
select e.id, e.subject, e.ts at time zone 'Asia/Seoul' as 이탈시각, min(p.ts) - e.ts as 복귀까지
from public.events e
left join public.events p on p.subject = e.subject and p.status = 'present' and p.id > e.id
where e.status = 'exit'
group by e.id, e.subject, e.ts order by e.id desc limit 20;

-- 사람, 상태별 개수
select subject, status, count(*) as n from public.events group by subject, status order by subject, status;

-- 처리 현황 (확인함 / 처리 완료 / 이상 없음)
select action, count(*) as n from public.alert_actions group by action;

-- 배터리 현황
select subject, battery_mv, level, updated_at at time zone 'Asia/Seoul' as 갱신 from public.beacon_status;

-- 사람 이름을 바꿨을 때 옛 기록의 이름도 바꾸기
update public.events set subject = '새이름' where subject = '옛이름';
update public.beacon_status set subject = '새이름' where subject = '옛이름';

-- 접근 정책 확인
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename;
```

### 3-8. 처음부터 다시 만들기 (프로젝트를 새로 만들 때)
SQL Editor에서 한 번에 실행하면 지금과 같은 구조가 만들어진다.
```sql
create table public.events (
  id bigint generated always as identity primary key,
  subject text not null,
  status text not null,
  receiver text,
  rssi integer,
  ts timestamptz default now()
);
create table public.beacon_status (
  minor int primary key,
  subject text not null,
  address text,
  battery_mv int not null,
  level text not null check (level in ('ok','warn','low')),
  temp_c real,
  updated_at timestamptz not null default now()
);
create table public.receivers (
  name text primary key,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);
create table public.alert_actions (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  action text not null check (action in ('acknowledged','resolved','false_alarm')),
  ts timestamptz not null default now()
);
create index alert_actions_event_id_idx on public.alert_actions(event_id);

alter table public.events enable row level security;
alter table public.beacon_status enable row level security;
alter table public.receivers enable row level security;
alter table public.alert_actions enable row level security;

create policy "insert for anon" on public.events for insert to anon with check (true);
create policy "select for anon" on public.events for select to anon using (true);
create policy "demo status insert" on public.beacon_status for insert to anon with check (true);
create policy "demo status update" on public.beacon_status for update to anon using (true) with check (true);
create policy "demo status select" on public.beacon_status for select to anon using (true);
create policy "demo receivers insert" on public.receivers for insert to anon with check (true);
create policy "demo receivers update" on public.receivers for update to anon using (true) with check (true);
create policy "demo receivers select" on public.receivers for select to anon using (true);
create policy "demo actions insert" on public.alert_actions for insert to anon with check (true);
create policy "demo actions select" on public.alert_actions for select to anon using (true);

alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.beacon_status;
alter publication supabase_realtime add table public.alert_actions;
```
새 프로젝트로 옮기면 앱 환경변수(Vercel, `.env`)와 게이트웨이의 주소/키도 바꾼다.

### 3-9. 새 표를 만들 때 체크리스트
1. 표 만들기 → 2. **RLS 켜기** → 3. 필요한 정책 만들기(없으면 앱에서 아무것도 안 보임) → 4. 실시간이 필요하면 publication에 등록 → 5. 앱의 타입과 훅 추가.

### 3-10. 요금제와 정지
무료(Free) 요금제는 한동안 활동이 없으면 프로젝트가 **일시 정지**될 수 있다고 알려져 있다. 정지되면 앱과 게이트웨이가 모두 실패한다. 대시보드에서 현재 요금제와 정책을 확인하고, 중요한 날(결선 전날 등)에는 대시보드를 열어 정상인지 확인한다. 정지돼 있으면 대시보드의 **Restore** 버튼으로 복구한다.

---

## 4. 앱 코드가 하는 일

### 4-1. 데이터가 앱에 들어오는 길
`App.tsx` 한곳에서 시작한다.
1. **앱이 켜질 때**: `events` 최근 20건을 읽어서 `events` 상태에 넣는다.
2. **그 뒤**: `events`에 새 행이 INSERT되면 실시간으로 받아 맨 앞에 붙인다. (최대 20건 유지)
   - `exit`이면 **경보 모달**(`activeAlert`)을 연다.
   - `present`이면 **같은 사람의 열려 있는 경보 모달을 자동으로 닫는다.**
   - 앱을 켜기 **전에** 있던 이벤트로는 모달이 안 뜬다 (실시간으로 받은 것만).
3. `useBeaconStatus()`가 `beacon_status`를 읽고 변경을 실시간으로 받는다. (사람 이름 → 배터리 상태)
4. `useAlertActions()`가 `alert_actions`를 읽고 변경을 실시간으로 받는다. (이벤트 번호 → 가장 마지막 처리)

### 4-2. 사람별 상태 (`components/PeopleCarousel.tsx`)
- 사람의 목록은 `App.tsx`의 `cores` 배열(착코어별 `subject`)에서 만든다. `subject`가 같으면 한 사람이다.
- `buildPeople(cores, events)`가 사람마다 **자기 이벤트 중 가장 최근 것**(배터리 이벤트 제외)으로 `breach`(이탈 중인지)를 계산한다.
- 이탈한 사람을 **맨 앞**으로 정렬하고, `PeopleCarousel`이 사람마다 카드 한 장을 좌우로 넘겨보게 한다. 새 이탈이 생기면 첫 카드로 자동으로 돌아온다.
- 문구/색: `toneBg`(배경색), `statusText`(상태 글자), `personLabel`(이름과 관계).
- 관계/나이("아들 · 만 8세")는 지금 `data.ts`의 `PROTECTED`와 이름이 같은 사람에게만 붙는다.

### 4-3. 알림 처리 (`components/NotificationPanel.tsx`, `AlertModal.tsx`)
- 경보 모달 버튼: **이상 없음**(`false_alarm` 기록), **확인**(`acknowledged` 기록 + 라이브 지도로 이동).
- 알림 패널의 이탈 알림마다 상태 표시가 붙는다: 미확인 → 확인함 → 처리 완료 / 이상 없음 / 자동 복귀(처리 없이 복귀).
- `isReturned(e, events)`: 그 이탈 뒤에 같은 사람의 복귀가 있는가.
- `isOpen(e, events, actions)`: 아직 끝나지 않은 이탈인가 (복귀 안 했고, 처리 완료/이상 없음이 아님).
- **종 아이콘의 붉은 점**: "처리 기록이 없고 복귀도 안 한 이탈"이 있을 때만 켜진다. (`App.tsx` 헤더)
- **지우기 버튼**: `isOpen`이 아닌 알림을 이 기기에서만 숨긴다. 숨긴 번호는 브라우저 저장소(`localStorage`의 `chakcare.cleared`)에 있다. DB는 건드리지 않는다. 기기별이라 폰에서 지워도 컴퓨터에서는 그대로다.

### 4-4. 지도 (`GuardianMap.tsx`)
- 보호자의 현재 위치(파란 점)를 브라우저 위치 기능으로 계속 따라간다. (위치 권한 필요, HTTPS 또는 localhost)
- 수신기 좌표는 `receivers` 표에서 읽어 **원**(반경 15m/30m)으로 그린다. 이탈 중이면 회색 점선 원.
- **수신기 위치는 자동으로 알아내지 않는다.** 오른쪽 아래 **핀 버튼**을 누르면, **누른 기기의 현재 위치**가 `receivers`에 저장된다. 그래서 게이트웨이(노트북) **바로 옆에서** 눌러야 정확하다. 노트북 위치는 와이파이 기반이라 오차가 클 수 있어, 폰으로 누르는 편이 낫다.
- `receivers.name`은 게이트웨이의 `--receiver` 값(예: `3층출입구`)과 같아야 한다. 이름이 안 맞으면 표의 **첫 번째 행**을 대신 쓴다.
- 비콘의 정확한 위치는 모른다. 지도의 원은 "이 수신기가 신호를 받는 구역"일 뿐이다.

### 4-5. 신호 막대와 배터리 (`components/ui.tsx`)
- `SignalBars`: 신호 세기를 3칸으로 보여준다. -65 이상 강함(3칸), -80 이상 보통(2칸), 그 아래 약함(1칸), 값이 없으면 "신호 없음"(0칸). 이탈 행은 `rssi`가 비어 있어 "신호 없음"이 나온다.
- `BatteryBadge`: `beacon_status`의 전압을 `batteryPercent()`(근사 곡선 `BATTERY_CURVE`)로 10% 단위 퍼센트로 바꿔 아이콘으로 보여준다. 70% 이상 초록, 30~69% 노랑, 30% 미만 빨강. 정확한 값이 아니라 **전압 기반 근사치**다.
- 한 사람에게 착코어가 여러 개여도 **첫 번째 코어**의 배터리만 보인다.

### 4-6. 샘플(가짜) 데이터가 있는 곳
시연에서 "예시 화면"이라고 말해야 하는 부분이다.
| 위치 | 내용 |
|---|---|
| `screens/ReportScreen.tsx` 전체 | 행동반경 지도, 자주 머무는 곳, 시간대별 안전 구역 |
| `screens/RewardScreen.tsx`, `App.tsx`의 `rewards`, `points` | 리워드 내역, 포인트 3,500 |
| `screens/MenuPages.tsx` | 프로필(김보호, 연락처), 구독, 자사몰 |
| `screens/LiveMapScreen.tsx` | "[실종경보] 성동구 실종아동" 배너 |

---

## 5. 게이트웨이 스크립트가 하는 일

파일: `C:\Users\USER1\scan_and_log_v3.py` (Python, 윈도우 노트북)

### 5-1. 준비와 실행
```bash
pip install bleak requests
python scan_and_log_v3.py --receiver "3층출입구"
```
- 노트북의 **블루투스를 켜고, 절전(잠자기) 모드를 끄고**, 전원을 연결한다.
- `--receiver` 값이 `events.receiver`와 `receivers.name`으로 쓰인다.
- 멈추려면 `Ctrl+C`. 실행한 폴더에 `logs/scan_날짜시간.csv`가 생긴다 (모든 원시 신호 기록: 시각, MAC, rssi, major, minor, 수신기).

### 5-2. 설정값 (파일 위쪽 "설정" 구간)
| 이름 | 의미 |
|---|---|
| `TARGET_UUID` | 우리 비콘의 UUID. 다른 UUID는 무시한다 |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | 서버 주소와 **Legacy anon 키** |
| `SUBJECT_NAMES` | Minor 번호 → 사람 이름 (등록 안 된 번호는 `minor-번호`로 표시) |
| `EXIT_THRESHOLD_SEC` | 이 시간(초) 동안 신호가 없으면 이탈. 지금 **30** |
| `BATTERY_WARN_MV`, `BATTERY_LOW_MV` | 배터리 등급 기준 (2800, 2600 mV) |
| `STATUS_PUSH_SEC` | 같은 등급일 때 배터리를 서버에 갱신하는 간격 (60초) |

### 5-3. 동작 순서
1. **iBeacon 패킷**을 받으면: Minor로 사람을 찾고 "마지막으로 본 시각"을 갱신한다. 그 사람이 이탈 상태였다면 **복귀(present)** 이벤트를 보낸다.
2. **1초마다** 모든 사람을 점검한다: 마지막으로 본 지 `EXIT_THRESHOLD_SEC` 이상이면 **이탈(exit)** 이벤트를 보낸다.
3. **TLM 패킷**(배터리)을 받으면: MAC 주소로 사람을 찾아(iBeacon으로 한 번 본 뒤에야 연결됨) 전압을 `beacon_status`에 덮어쓰고, `low` 등급이 되는 순간 `low_battery` 이벤트를 한 번 보낸다.
4. 서버 전송이 실패해도 스크립트는 멈추지 않는다 (`[서버 전송 실패]` 메시지만 출력).

### 5-4. 알아둘 동작
- 스크립트를 켠 뒤 **한 번도 신호를 못 받은 비콘은 이탈로 판정되지 않는다.**
- 스크립트를 껐다 켜면 내부 상태가 초기화된다. 비콘이 멀리 있는 채로 재시작하면 DB에는 `exit`가 남아 있는데 스크립트는 모르는 상태가 된다.
- **노트북이 꺼지거나 스크립트가 죽으면 알림이 전부 멈춘다.** 감시가 멈췄다는 표시는 아직 없다.
- 노트북 블루투스는 신호를 자주 놓친다 (실측: 아무 일 없어도 최대 약 23초 끊김). 그래서 이탈 기준이 30초다.

---

## 6. 비콘 설정 (DX-SMART 앱)

| 항목 | 값 |
|---|---|
| 제품 | DX-CP27 (CR2032 전지) |
| UUID | `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0` (스크립트와 같아야 함) |
| Major | 5 (스크립트는 Major를 보지 않는다) |
| Minor | 1 = 김서준(MAC `48:87:2D:9D:CF:DE`), 2 = 김민수(MAC `48:87:2D:9E:42:A2`) |
| 프레임 | iBeacon + TLM만 켬, 나머지(Device info, UID, URL, ACC, User)는 NoData |
| 간격 | iBeacon 200ms, TLM 1000ms |
| 송신 출력 | 최대(+2.5 dBm) |

**설정 방법**: 폰에 DX-SMART 설치 → 비콘의 QR을 **Scan connection**으로 스캔(또는 목록에서 Connect) → 비밀번호 입력(공장 기본값은 설명서에 있다. 바꿨다면 바꾼 값) → 아래 **Frame** 탭에서 프레임별 설정 → 각 프레임마다 **SAVE** → 연결 끊기.
- **연결 중인 비콘은 신호 방송이 끊길 수 있다** (설명서 기준). 설정이 끝나면 앱을 종료하고 연결을 꼭 끊는다. 폰의 DX-SMART 앱이 연결된 채로 두면 게이트웨이가 신호를 못 받는다.
- 전원: 버튼 1초 = 켜기(빨간불 1번), 4초 길게 = 끄기.
- 전지는 새것이 약 3.0V다. 약 2.6V 아래면 교체를 준비한다.
- TLM 프레임은 이 제품에서 **리틀엔디언**이다(`[0]=0x20, [2:4]=전압mV, [4:6]=온도`). 스크립트의 `parse_tlm`이 이 구조를 쓴다.
- **새 비콘을 추가하려면**: Minor를 새 번호로 설정하고(한 개씩 따로 설정해야 구분됨) 7장의 "사람 추가"를 따른다.

---

## 7. "이걸 바꾸고 싶다" 하면 어디를 고치나

### 판정과 기준
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| 이탈 판정 시간 (30초) | 스크립트 `EXIT_THRESHOLD_SEC` |
| 배터리 등급 기준 (정상/주의/교체 필요, 배터리 부족 알림) | 스크립트 `BATTERY_WARN_MV`, `BATTERY_LOW_MV` |
| 앱의 배터리 퍼센트 환산 | `components/ui.tsx`의 `BATTERY_CURVE` |
| 배터리 아이콘 색 기준 (70/30) | `components/ui.tsx`의 `BatteryBar` |
| 신호 막대 기준 (-65/-80) | `components/ui.tsx`의 `SignalBars` |
| 알림 목록 최대 개수 (20) | `App.tsx`의 `.limit(20)`과 `.slice(0, 20)` |

### 사람과 비콘
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| **사람 추가** | ① 비콘에 새 Minor 설정 ② 스크립트 `SUBJECT_NAMES`에 번호와 이름 ③ `App.tsx`의 `cores`에 `{ id, name, connected: true, monitoring: true, subject: "이름" }` 추가. 카드, 알림, 지도, 배터리가 자동으로 따라온다 |
| 사람 이름 변경 | 스크립트 `SUBJECT_NAMES`, `App.tsx`의 `cores`의 `subject`, `data.ts`의 `PROTECTED.name`을 **같은 글자로** 바꾸고, 옛 기록의 이름은 3-7의 `update` SQL로 바꾼다 |
| 관계/나이 표시 | `data.ts`의 `PROTECTED`. 다른 사람에게도 보이려면 `PeopleCarousel.tsx`의 `buildPeople`에서 `relation`을 정하는 줄을 고친다 |
| 모니터링 켜짐/꺼짐 기본값 | `App.tsx`의 `cores`의 `monitoring` |

### 수신기와 지도
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| 수신기 이름 | 스크립트 실행 때 `--receiver "이름"`, `receivers.name`, `LiveMapScreen.tsx`의 기본값 `"3층출입구"` |
| 수신기 위치 | 앱 지도의 핀 버튼(수신기 옆에서 누르기) 또는 Table Editor의 `receivers` |
| 안전반경 선택지 (15m/30m) | `LiveMapScreen.tsx`의 `[15, 30].map` 부분과 라벨, 기본값은 `App.tsx`의 `useState(30)`. 이 값은 **지도의 원 크기**일 뿐 판정에는 영향이 없다 |
| 지도 기본 위치 | `GuardianMap.tsx`의 `FALLBACK_CENTER` |

### 문구, 색, 화면
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| 색(민트, 코랄, 남색), 글꼴 | `index.css`의 `@theme` |
| 사람 카드의 상태 문구 | `PeopleCarousel.tsx`의 `statusText` |
| 알림 제목/문구 | `NotificationPanel.tsx`의 `EVENT_UI` |
| 처리 버튼 이름 (확인함, 처리 완료, 이상 없음) | `NotificationPanel.tsx`의 `ACTION_LABEL`, 경보 모달 버튼은 `AlertModal.tsx`의 `confirm`/`dismissLabel` |
| 경보 모달의 내용 | `AlertModal.tsx`의 `AlertModal` |
| 아래 탭 | `App.tsx`의 `TABS` |
| 아이콘 추가 | `components/Icon.tsx`의 `ICONS`에 SVG 한 줄 추가 |
| 카톡 미리보기 제목/설명/이미지 | `.figma/make/site.json` (title, description, openGraph.image), 바꾼 뒤 카카오 디버거에서 캐시 갱신 |
| 페이지 제목 | `index.html`의 `<title>` |

### 동작 규칙을 바꿀 때
| 바꾸고 싶은 것 | 고칠 곳 |
|---|---|
| 처리 종류 추가 (예: "보류") | DB `alert_actions`의 `action` 제약(`check`)을 SQL로 바꾸고, `lib/useAlertActions.ts`의 `ActionKind`, `NotificationPanel.tsx`의 `ACTION_LABEL`과 `ExitActions` |
| 새 이벤트 종류 추가 | 게이트웨이가 새 `status`를 보내게 하고, `lib/supabase.ts`의 `EventRow.status`, `NotificationPanel.tsx`의 `EVENT_UI`, 필요하면 `PeopleCarousel.tsx`의 `buildPeople` |
| 붉은 점 조건 | `App.tsx` 헤더의 `events.some(...)` |
| 지우기가 지울 수 있는 범위 | `NotificationPanel.tsx`의 `isOpen` |

---

## 8. 개발, 배포, 되돌리기

### 로컬에서 실행
```bash
pnpm install        # 처음 한 번
pnpm dev            # http://localhost:5173
```
프로젝트 폴더에 `.env` 파일이 있어야 한다 (깃에는 없음).
```
VITE_SUPABASE_URL=https://프로젝트주소.supabase.co
VITE_SUPABASE_ANON_KEY=공개용키
```
- `.env`는 서버를 **켤 때 한 번만** 읽는다. 값을 바꾸면 서버를 껐다 켠다.
- 이름 앞의 `VITE_`가 있어야 브라우저 코드에서 읽힌다.

### 검사
```bash
npx tsc --noEmit -p tsconfig.app.json   # 타입 검사 (이 명령으로만 제대로 검사됨)
pnpm build                              # 배포용 빌드 테스트
```
루트에서 `npx tsc --noEmit`만 돌리면 아무것도 검사하지 않는다.

### 배포 흐름
1. 브랜치를 만들어 작업 → 커밋 → 푸시
2. GitHub에서 **Pull Request** 생성 → 웹에서 **Merge**
3. `main`에 합쳐지면 **Vercel이 자동으로 배포**한다 (1~2분). 배포 상태는 Vercel의 Deployments 탭.
- **PR을 연 뒤에 같은 브랜치에 커밋을 더 올리면, 그 사이에 머지됐을 때 뒷부분이 빠진다.** PR을 열기 전에 끝내거나, 머지된 뒤에는 새 브랜치로 올린다.
- 배포마다 고유 주소(`chak-care-xxxx.vercel.app`)가 생기는데 **그때 상태로 고정된 사본**이고 로그인 보호가 걸려 있다. 항상 최신인 주소는 `https://chack-care.vercel.app`.
- Vercel 환경변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)는 Project → Settings → Environment Variables. **바꾼 뒤에는 새 배포가 있어야 적용된다** (Deployments → Redeploy).
- 화면이 안 바뀌면 강력 새로고침(`Ctrl+Shift+R`)부터.

### 되돌리기
- 문제가 있는 PR은 GitHub의 PR 화면에서 **Revert** 버튼으로 되돌리는 PR을 만들 수 있다.
- 급할 때는 Vercel의 Deployments에서 이전 배포를 프로덕션으로 다시 올릴 수 있다 (메뉴 이름은 `Instant Rollback` 또는 `Promote to Production`처럼 보일 수 있다. 화면 구성은 바뀔 수 있으니 Deployments 탭에서 확인).

---

## 9. 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 이탈해도 앱에 경보가 안 뜬다 | ① 게이트웨이에 `이탈 감지`와 `[서버 전송 완료]`가 찍혔나 ② Table Editor의 `events`에 행이 생겼나 ③ 앱을 새로고침했나 ④ 앱 사람 이름과 `events.subject` 글자가 같은가 |
| 게이트웨이에 `[서버 전송 실패] 401/403` | 키가 틀렸거나 Legacy anon 키가 아님, 또는 접근 정책이 없음 |
| `[서버 전송 실패] 409` | 연결된 행이 없음 (예: 지워진 이벤트에 처리 기록을 쓰려 할 때) |
| 비콘 신호가 0건 | 비콘이 폰 앱에 연결돼 있지 않은지, 켜져 있는지(빨간불), 노트북 블루투스가 켜져 있는지, `TARGET_UUID`가 같은지 |
| 아무 일 없는데 가짜 이탈이 뜬다 | 노트북이 신호를 놓친 것. `EXIT_THRESHOLD_SEC`를 늘린다 |
| "배터리 확인 중"만 보인다 | 게이트웨이를 `v3`로 실행했나, iBeacon 신호를 먼저 한 번 받았나(시작 직후 몇 초), `beacon_status`에 행이 있나 |
| 지도에 원이 안 보인다 | 핀 버튼으로 수신기 위치를 지정했나, `receivers`에 행이 있나 |
| 지도에 내 위치(파란 점)가 없다 | 브라우저 위치 권한 허용, HTTPS 또는 localhost인지 확인 |
| 알림을 지웠는데 다시 보인다 | 지우기는 기기별이다. 다른 기기나 브라우저에서는 따로 지워야 한다 |
| 앱이 아예 비어 있다/에러 | 브라우저 개발자 도구 Console 확인. Vercel 환경변수가 Production에 들어 있는지, Supabase 프로젝트가 정지되지 않았는지 |
| 코드를 고쳤는데 화면이 그대로다 | 개발 서버가 `.env` 변경을 못 읽었거나 브라우저 캐시. 서버를 재시작하고 강력 새로고침 |
| Supabase 요청이 전송되지 않는다 | `supabase....insert(...)`는 `await`나 `.then`을 걸어야 실제로 전송된다 |

---

## 10. 알려진 한계 (시연 전에 알고 있을 것)
- 수신기가 **노트북 1대**라 그 노트북이 단일 장애 지점이다.
- 이탈 판정은 **규칙 기반(30초 무수신)**이다. AI/머신러닝은 아직 없다 (칼만필터, DBSCAN은 로드맵).
- 이탈 알림 지연은 **약 31초**(실측)이고, 복귀는 약 1초다. "0.5초" 같은 표현은 쓰지 않는다.
- 지도는 비콘의 정확한 위치가 아니라 **수신 구역**이다. 수신기 위치는 사람이 직접 지정한다.
- 접근 규칙(RLS)이 **시연용으로 열려 있다.**
- 리포트, 리워드, 메뉴 일부는 **샘플 데이터**다.
- 푸시 알림이 없다. 화면이 켜져 있을 때만 경보가 보인다.
- 배터리 퍼센트는 전압 기반 **근사치**다.

---

## 11. 시연 전 체크리스트
1. Supabase 대시보드를 열어 프로젝트가 정상(정지 아님)인지 확인
2. 비콘 두 개가 켜져 있고(빨간불), 전지 전압이 정상인지(앱 배터리 아이콘 초록)
3. 게이트웨이 노트북: 블루투스 켜짐, 절전 끔, 전원 연결, `scan_and_log_v3.py` 실행 중
4. 비콘이 모두 수신 범위 안에서 **안심 상태**일 때 `events`를 정리하고(3-6), 앱을 새로고침
5. 폰과 컴퓨터의 알림창에서 **지우기**
6. 라이브 지도에서 수신기 옆에서 **핀 버튼**을 눌러 위치 지정 (이미 했다면 생략)
7. 비콘을 끄거나 신호를 막고 **약 30초 대기** → 경보 모달 → 확인 → 복귀 확인
8. 백업: 시연 영상, `events`/`beacon_status` CSV

---

## 12. 용어
| 용어 | 뜻 |
|---|---|
| 비콘 | 블루투스로 자기 번호를 계속 방송하는 작은 장치 |
| iBeacon | 비콘의 방송 방식 중 하나. UUID, Major, Minor를 보낸다 |
| UUID / Major / Minor | 서비스 전체 / 그룹 / 개별 번호. 우리는 Minor로 사람을 구분 |
| TLM | 전압, 온도 등 상태를 보내는 방송 |
| RSSI | 받은 신호 세기(dBm). 거리가 아니다 |
| 게이트웨이(수신기) | 비콘 신호를 듣고 판정해서 서버로 보내는 장치 |
| Supabase | 데이터베이스와 실시간 전달을 해주는 서비스 |
| RLS | 표마다 "누가 읽고 쓸 수 있는지"를 정하는 접근 규칙 |
| anon 키 | 공개돼도 되게 설계된 키 (접근 규칙의 제한을 받는다) |
| service_role 키 | 접근 규칙을 무시하는 만능 키. 절대 공개 금지 |
| Realtime | 새 행이 생기면 앱에 바로 알려주는 기능 |
| PR | 코드 변경을 `main`에 합치기 전에 올리는 요청 |
| Vercel | 앱을 인터넷에 올려주는 서비스 |
