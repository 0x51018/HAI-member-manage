'use client';

export default function GuidePage() {
  return (
    <div>
      <h1>운영자 가이드</h1>
      <section>
        <h2>로그인</h2>
        <p>
          서비스가 처음 실행되면 <code>.env</code> 파일의 <code>ADMIN_EMAIL</code>,
          <code>ADMIN_PASSWORD</code>로 로그인할 수 있습니다.
        </p>
      </section>
      <section>
        <h2>추가 운영진 계정 생성</h2>
        <p>
          UI에서 운영진 계정을 만들 수 없으므로 서버에서 다음 명령을 실행합니다.
          이미 존재하는 경우 비밀번호만 업데이트됩니다.
        </p>
        <pre>
{`ADMIN_EMAIL=newadmin@example.com \
ADMIN_PASSWORD=strongpass \
pnpm --filter @apps/api db:seed`}
        </pre>
        <p>
          이 스크립트는 예시 학기와 분반도 함께 생성하므로 필요한 경우 삭제해
          주세요.
        </p>
      </section>
      <section>
        <h2>학기와 분반 준비</h2>
        <p>
          상단 내비게이션의 <strong>Terms</strong> 페이지에서 학기를 추가하고,
          <strong>Sections</strong> 페이지에서 분반을 만듭니다.
        </p>
      </section>
      <section>
        <h2>부원 정보 등록</h2>
        <ol>
          <li>CSV 파일을 준비합니다. 헤더에는 이름, 학번, 전화번호 등이 필요합니다.</li>
          <li>
            <strong>Import Members</strong> 페이지로 이동하여 학기를 선택하고 CSV를 업로드합니다.
          </li>
          <li>
            업로드가 완료되면 생성/업데이트 수와 오류를 확인하고, JSON 리포트를
            다운로드할 수 있습니다.
          </li>
        </ol>
      </section>
      <section>
        <h2>이벤트와 출석</h2>
        <p>
          이벤트는 <strong>Events</strong> 페이지에서 생성하고 참가자를 관리할 수
          있습니다. 분반 출석은 <strong>Sessions</strong> 메뉴에서 진행합니다.
        </p>
      </section>
    </div>
  );
}
