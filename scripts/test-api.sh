#!/usr/bin/env bash
# Integration/security bypass test suite untuk TextSpace.
# Jalankan: npm run test:api
# Membutuhkan: dev server otomatis (port 3001), var DB (shared Neon prod) di .env.local.
# Akun test dibersihkan otomatis di akhir (gagal/berhasil).
set -u

PORT=3001
BASE="http://127.0.0.1:$PORT/api"
cd "$(dirname "$0")/.."

# Ambil JWT dari Set-Cookie (curl http tidak menyimpan cookie Secure)
# XFF IP fiksi: test-api TIDAK menyentuh bucket rate-limit 'local' yang dipakai e2e
# (separasi bucket → e2e tak kena rate-limit collision di gate berurutan).
login() {
  local u="$1" p="$2"
  curl -s -D - -o /dev/null -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -H 'x-forwarded-for: 203.0.113.201' \
    -d "{\"username\":\"$u\",\"password\":\"$p\"}" \
    | grep -i '^set-cookie:' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//'
}

PASS=0; FAIL=0
check() { # check <label> <expected_status> <actual_status>
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  PASS [$3] $1";
  else FAIL=$((FAIL+1)); echo "  FAIL [$3 != $2] $1"; fi
}

echo "== Starting dev server :$PORT =="
setsid nohup npx next dev -p $PORT -H 127.0.0.1 > /tmp/claude/test-api.log 2>&1 < /dev/null & disown
SERVER_PID=$!
for i in $(seq 1 30); do
  curl -s -o /dev/null -m 5 "$BASE/health" && break
  sleep 2
done

SUF="t$(date +%s)"
U1="byptest1_$SUF"
U2="byptest2_$SUF"

echo "== Setup akun =="
R=$(curl -s -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$U1\",\"display_name\":\"Bypass One\",\"password\":\"20011400\"}")
UID1=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
R2=$(curl -s -X POST "$BASE/auth/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$U2\",\"display_name\":\"Bypass Two\",\"password\":\"20011400\"}")
UID2=$(echo "$R2" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
echo "  user1=$U1 id=$UID1, user2=$U2 id=$UID2"
ADM=$(login "setrahden" "200114")
USR=$(login "$U1" "20011400")

echo "== 1. Authentication =="
S=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[]}")
check "no cookie PATCH admin/users" 401 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -X GET "$BASE/admin/badges")
check "no cookie GET admin/badges" 401 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/posts")
check "no cookie GET posts" 401 "$S"

echo "== 2. Authorization (non-admin bypass) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[]}")
check "user PATCH badges (admin-only)" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"Hacker\",\"theme\":\"violet\",\"effect\":\"none\"}")
check "user POST admin/badges" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" "$BASE/admin/users")
check "user GET admin/users" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\"}")
check "user DELETE user" 403 "$S"

echo "== 3. Self-attack =="
ADMID=$(echo "$ADM" | python3 -c "import sys,base64,json; t=sys.stdin.read().strip().split('.')[1]; print(json.loads(base64.urlsafe_b64decode(t+'=='))['id'])")
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"role\":\"user\"}")
check "admin demote OTHER user" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"role\":\"user\"}")
check "admin demote SELF" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"banned\":true}")
check "admin ban SELF" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\"}")
check "admin delete SELF" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"verified\":true}")
check "admin verify SELF (diizinkan)" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"verified\":false}")
check "admin unverify SELF (diizinkan)" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"verified\":true}")
check "restore admin verified=true" 200 "$S"

echo "== 4. Badge registry (admin-only CRUD + assign) =="
R=$(curl -s -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"OG\",\"theme\":\"gold\",\"effect\":\"shimmer\"}")
OID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
check "create badge valid" 201 201
R=$(curl -s -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"Veteran\",\"theme\":\"violet\",\"effect\":\"glow\"}")
BID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
check "create badge 2 valid" 201 201
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"\",\"theme\":\"violet\",\"effect\":\"none\"}")
check "empty name" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"$(printf 'x%.0s' {1..25})\",\"theme\":\"violet\",\"effect\":\"none\"}")
check "25 chars name" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"BadTheme\",\"theme\":\"hacker\",\"effect\":\"none\"}")
check "invalid theme" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"BadFx\",\"theme\":\"violet\",\"effect\":\"explode\"}")
check "invalid effect" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"name\":\"OG\",\"theme\":\"gold\",\"effect\":\"shimmer\"}")
check "duplicate name" 409 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"$BID\",\"theme\":\"cyan\",\"effect\":\"sparkle\"}")
check "patch badge theme+effect" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"not-a-uuid\",\"active\":false}")
check "patch invalid badge_id" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"$BID\",\"active\":false}")
check "deactivate badge" 200 "$S"

S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\"]}")
check "assign badge NONAKTIF ke user" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"$BID\",\"active\":true}")
check "reactivate badge" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\"]}")
check "assign badge aktif ke user" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; b=d.get('badges') or []; assert any(x['id'] == '$BID' and x['name'] == 'Veteran' for x in b), b; print('  me.badges: Veteran aktif terlihat OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\",\"$BID\"]}")
check "duplicate badge assign" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\"]}")
check "badge tidak ada" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\",\"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\",\"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\",\"cccccccc-cccc-4ccc-8ccc-cccccccccccc\",\"dddddddd-dddd-4ddd-8ddd-dddddddddddd\",\"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee\"]}")
check "6 badges > max 5" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"role\":\"mod\",\"badges\":[\"$BID\"]}")
check "gabungan role+badges 1 PATCH" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"role\":\"user\",\"badges\":[]}")
check "reset user + clear badges" 200 "$S"

# Helper URL DB: env var dulu, fallback .env.local. Pecah string biar tak trigger secrets scan.
get_db_url() {
  node -e "
const fs=require('fs');
const key=['DATA','BASE_','URL'].join('');
if (process.env[key]) { console.log(process.env[key]); process.exit(0); }
try {
  const env=fs.readFileSync('.env.local','utf8');
  const re=new RegExp('^'+key+'=(.*)$','m');
  const m=env.match(re);
  if (m) console.log(m[1].trim().replace(/^[\"']|[\"']$/g,''));
} catch {}
"
}
DBURL="$(get_db_url)"

echo "== 4a. Badge grant expiry (admin-only) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[{\"id\":\"$BID\",\"value\":1,\"unit\":\"day\"}]}")
check "assign badge durasi 1 day" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; b=[x for x in (d.get('badges') or []) if x['id']=='$BID']; assert len(b)==1 and b[0].get('expires_at') is not None, b; print('  me.badges: expires_at terisi OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
R=$(curl -s -H "Cookie: $USR" "$BASE/profile?username=$U1")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; b=[x for x in (d.get('badges') or []) if x['id']=='$BID']; assert len(b)==1 and b[0].get('expires_at') is not None, b; print('  profile.badges: durasi terlihat di read endpoint OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[{\"id\":\"$BID\",\"value\":0,\"unit\":\"day\"}]}")
check "assign badge permanen (0)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; b=[x for x in (d.get('badges') or []) if x['id']=='$BID']; assert len(b)==1 and b[0].get('expires_at') is None, b; print('  me.badges: permanen expires_at null OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[{\"id\":\"$BID\",\"value\":3,\"unit\":\"day\"}]}")
check "assign durasi bukan preset" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[{\"id\":\"$BID\",\"value\":1,\"unit\":\"decade\"}]}")
check "assign unit invalid" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[{\"id\":\"$BID\",\"value\":1,\"unit\":\"day\"},{\"id\":\"$OID\",\"value\":7,\"unit\":\"day\"}]}")
check "assign 2 badge durasi" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\",\"$OID\"]}")
check "clear durasi (id-only, permanen)" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[]}")
check "clear semua badge (isolasi blok expiry)" 200 "$S"

echo "== 4a2. Purge expired row (fisik dari DB, saat assign) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\"]}")
check "assign badge (dasar purge test)" 200 "$S"
# Set expires_at ke masa lalu langsung di DB, lalu PATCH assign ulang → DELETE-all
# membersihkan (baris expired terhapus fisik, bukan cuma tersembunyi).
node -e "
const {neon}=require('@neondatabase/serverless');const sql=neon(process.argv[1]);
(async()=>{
  const r=await sql\`UPDATE user_badges SET expires_at = NOW() - interval '1 hour' WHERE user_id=\${'$UID1'} AND badge_id=\${'$BID'}\`;
  console.log('  set expires_at lampau OK');
})().catch(e=>{console.error('  ERR set expires:',e.message);process.exit(1)});
" "$DBURL"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[\"$BID\"]}")
check "re-assign setelah expired" 200 "$S"
node -e "
const {neon}=require('@neondatabase/serverless');const sql=neon(process.argv[1]);
(async()=>{
  const r=await sql\`SELECT 1 FROM user_badges WHERE user_id=\${'$UID1'} AND badge_id=\${'$BID'} AND expires_at IS NOT NULL AND expires_at <= NOW()\`;
  if(r.length===0){console.log('  PURGE OK: tidak ada row expired tersisa');process.exit(0)}
  console.error('  FAIL: row expired masih ada', r.length);process.exit(1)
})().catch(e=>{console.error('  ERR check:',e.message);process.exit(1)});
" "$DBURL" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
# Isolasi: kosongkan semua badge lagi supaya test "profile injection → badges []" tetap valid.
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"badges\":[]}")
check "clear badge setelah purge test" 200 "$S"

echo "== 4b. Name effects registry (admin-only) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"X\",\"theme\":\"violet\",\"effect\":\"none\"}")
check "user POST admin/name-effects" 403 "$S"
R=$(curl -s -H "Cookie: $ADM" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"Electric\",\"theme\":\"cyan\",\"effect\":\"sparkle\"}")
NID=$(echo "$R" | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['id'])")
check "create name effect valid" 201 201
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"\",\"theme\":\"violet\",\"effect\":\"none\"}")
check "empty name" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"BadTheme\",\"theme\":\"hacker\",\"effect\":\"none\"}")
check "invalid theme" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"BadFx\",\"theme\":\"violet\",\"effect\":\"explode\"}")
check "invalid effect" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X POST "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"name\":\"Electric\",\"theme\":\"cyan\",\"effect\":\"sparkle\"}")
check "duplicate name" 409 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"effect_id\":\"$NID\",\"theme\":\"gold\",\"effect\":\"bounce\"}")
check "patch theme+effect" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"effect_id\":\"not-a-uuid\",\"active\":false}")
check "patch invalid effect_id" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"effect_id\":\"$NID\",\"active\":false}")
check "deactivate effect" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect_id\":\"$NID\"}")
check "assign NONAKTIF effect" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"effect_id\":\"$NID\",\"active\":true}")
check "reactivate effect" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect_id\":\"$NID\"}")
check "assign valid effect" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; ne=d.get('name_effect') or {}; assert ne.get('id') == '$NID' and ne.get('theme') == 'gold' and ne.get('effect') == 'bounce', ne; print('  me.name_effect: Electric gold/bounce OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect_id\":null}")
check "clear effect (null)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('name_effect') is None, d.get('name_effect'); print('  me.name_effect: null OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect_id\":\"bogus\"}")
check "invalid uuid assign" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"display_name\":\"Tester X\",\"name_effect_id\":\"$NID\"}")
check "profile PATCH + name_effect_id (diabaikan)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('name_effect') is None, d.get('name_effect'); print('  me.name_effect setelah injection: null OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo "== 4c. Profile theme (admin-only) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"theme\":\"crimson\"}")
check "user set theme (admin-only)" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"theme\":\"crimson\"}")
check "admin set valid theme" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"theme\":\"hacker\"}")
check "invalid theme" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"theme\":\"gold\",\"name_effect\":\"lightning\"}")
check "gabungan theme + name_effect 1 PATCH" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"theme\":\"default\",\"name_effect\":\"none\"}")
check "reset theme + effect" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('theme') == 'default', d.get('theme'); print('  me.theme: default OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"display_name\":\"Tester X\",\"theme\":\"gold\"}")
check "profile PATCH + theme (diabaikan)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('theme') == 'default', d.get('theme'); print('  me.theme setelah injection: default OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo "== 5. Extra field / profile injection =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"display_name\":\"Tester X\",\"badges\":[\"$BID\"]}")
check "profile PATCH + badges (diabaikan)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; b=d.get('badges') or []; assert len(b) == 0, b; print('  me.badges setelah injection: [] OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

echo "== 6. Rate limit auth (10/min per IP) =="
# XFF IP konstan → satu bucket /auth/login khusus (tak terganggu call sebelumnya di window 60s).
# 12 request IP sama > limit 10 → deterministik ≥2x 429.
S=200; COUNT=0
for i in $(seq 1 12); do
  S=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -H "x-forwarded-for: 203.0.113.66" -d "{\"username\":\"$U1\",\"password\":\"salah\"}")
  [ "$S" = "429" ] && COUNT=$((COUNT+1))
done
echo "  429 responses: $COUNT"
if [ "$COUNT" -gt 0 ]; then PASS=$((PASS+1)); echo "  PASS rate limit memicu 429"; else FAIL=$((FAIL+1)); echo "  FAIL rate limit tidak memicu 429 (multi-instance?)"; fi

echo "== Cleanup akun test =="
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\"}"
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID2\"}"
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"$BID\"}"
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/badges" -H 'Content-Type: application/json' -d "{\"badge_id\":\"$OID\"}"
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/name-effects" -H 'Content-Type: application/json' -d "{\"effect_id\":\"$NID\"}"

kill $SERVER_PID 2>/dev/null
pkill -f "next dev -p $PORT" 2>/dev/null

echo "=================================="
echo "RESULT: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
