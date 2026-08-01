#!/usr/bin/env bash
# Integration/security bypass test suite untuk TextSpace.
# Jalankan: npm run test:api
# Membutuhkan: dev server otomatis (port 3001), DATABASE_URL di .env.local (shared Neon prod).
# Akun test dibersihkan otomatis di akhir (gagal/berhasil).
set -u

PORT=3001
BASE="http://127.0.0.1:$PORT/api"
cd "$(dirname "$0")/.."

# Ambil JWT dari Set-Cookie (curl http tidak menyimpan cookie Secure)
login() {
  local u="$1" p="$2"
  curl -s -D - -o /dev/null -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
    -d "{\"username\":\"$u\",\"password\":\"$p\"}" \
    | grep -i '^set-cookie:' | sed 's/^[Ss]et-[Cc]ookie: //; s/;.*//'
}

PASS=0; FAIL=0
check() { # check <label> <expected_status> <actual_status>
  if [ "$2" = "$3" ]; then PASS=$((PASS+1)); echo "  PASS [$3] $1";
  else FAIL=$((FAIL+1)); echo "  FAIL [$3 != $2] $1"; fi
}

echo "== Starting dev server :$PORT =="
setsid nohup npx next dev -p $PORT -H 127.0.0.1 > /tmp/opencode/test-api.log 2>&1 < /dev/null & disown
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
S=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"X\"]}")
check "no cookie PATCH admin/users" 401 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/posts")
check "no cookie GET posts" 401 "$S"

echo "== 2. Authorization (non-admin bypass) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"Hacker\"]}")
check "user PATCH custom_roles (admin-only)" 403 "$S"
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
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"custom_roles\":[\"Boss\"]}")
check "admin set custom_roles SELF (diizinkan)" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"custom_roles\":[]}")
check "admin clear custom_roles SELF" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ADMID\",\"verified\":true}")
check "restore admin verified=true" 200 "$S"

echo "== 4. Boundary validasi custom_roles =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"$(printf 'x%.0s' {1..25})\"]}")
check "25 chars" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\"]}")
check "6 roles" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"Dup\",\"Dup\"]}")
check "duplicate roles" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[\"OK Role\"]}")
check "valid role" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"custom_roles\":[]}")
check "clear roles" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"role\":\"mod\",\"custom_roles\":[\"Combo\"]}")
check "gabungan role+custom_roles 1 PATCH" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"role\":\"user\",\"custom_roles\":[]}")
check "reset user + clear" 200 "$S"

echo "== 4b. Name effect (admin-only) =="
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect\":\"lightning\"}")
check "user set name_effect (admin-only)" 403 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect\":\"lightning\"}")
check "admin set valid effect" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect\":\"hacker\"}")
check "invalid effect" 400 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect\":\"gold\",\"custom_roles\":[\"GOLDIE\"]}")
check "gabungan effect + custom_roles 1 PATCH" 200 "$S"
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $ADM" -X PATCH "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\",\"name_effect\":\"none\",\"custom_roles\":[]}")
check "reset effect + clear" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('name_effect') == 'none', d.get('name_effect'); print('  me.name_effect: none OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"display_name\":\"Tester X\",\"name_effect\":\"gold\"}")
check "profile PATCH + name_effect (diabaikan)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; assert d.get('name_effect') == 'none', d.get('name_effect'); print('  me.name_effect setelah injection: none OK')" && PASS=$((PASS+1)) || FAIL=$((FAIL+1))

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
S=$(curl -s -o /dev/null -w '%{http_code}' -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"display_name\":\"Tester X\",\"custom_roles\":[\"Hacked\"]}")
check "profile PATCH + custom_roles (diabaikan)" 200 "$S"
R=$(curl -s -H "Cookie: $USR" "$BASE/auth/me")
echo "$R" | python3 -c "import json,sys; d=json.load(sys.stdin)['data']; print('  me.custom_roles:', d.get('custom_roles'))"
curl -s -o /dev/null -H "Cookie: $USR" -X PATCH "$BASE/profile" -H 'Content-Type: application/json' -d "{\"custom_roles\":[\"Hacked\"]}"

echo "== 6. Rate limit auth (10/min) =="
S=200; COUNT=0
for i in $(seq 1 12); do
  S=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/auth/login" -H 'Content-Type: application/json' -d "{\"username\":\"$U1\",\"password\":\"salah\"}")
  [ "$S" = "429" ] && COUNT=$((COUNT+1))
done
echo "  429 responses: $COUNT"
if [ "$COUNT" -gt 0 ]; then PASS=$((PASS+1)); echo "  PASS rate limit memicu 429"; else FAIL=$((FAIL+1)); echo "  FAIL rate limit tidak memicu 429 (multi-instance?)"; fi

echo "== Cleanup akun test =="
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID1\"}"
curl -s -o /dev/null -H "Cookie: $ADM" -X DELETE "$BASE/admin/users" -H 'Content-Type: application/json' -d "{\"user_id\":\"$UID2\"}"

kill $SERVER_PID 2>/dev/null
pkill -f "next dev -p $PORT" 2>/dev/null

echo "=================================="
echo "RESULT: PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ] || exit 1
