import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  ip: string;
  userAgent: string;
  loginTime: string;
}

export function LoginAlertEmail({ ip, userAgent, loginTime }: Props) {
  return (
    <BaseLayout>
      <Preview>새로운 로그인이 감지되었습니다</Preview>
      <Heading>로그인 알림</Heading>
      <Text>방금 귀하의 계정에 로그인되었습니다.</Text>
      <Text>
        <strong>시간:</strong> {loginTime}
        <br />
        <strong>IP:</strong> {ip}
        <br />
        <strong>브라우저:</strong> {userAgent}
      </Text>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        본인이 아닌 경우 즉시 비밀번호를 변경하고 계정을 확인하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderLoginAlert(ip: string, userAgent: string): Promise<string> {
  const loginTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  return render(<LoginAlertEmail ip={ip} userAgent={userAgent} loginTime={loginTime} />);
}
