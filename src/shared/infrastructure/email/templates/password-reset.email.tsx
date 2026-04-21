import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  resetUrl: string;
}

const buttonStyle = {
  backgroundColor: '#dc3545',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function PasswordResetEmail({ resetUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>비밀번호 재설정 요청</Preview>
      <Heading>비밀번호 재설정</Heading>
      <Text>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하세요.</Text>
      <Button href={resetUrl} style={buttonStyle}>비밀번호 재설정하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 1시간 동안 유효합니다. 본인이 요청하지 않은 경우 즉시 비밀번호를 변경하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderPasswordReset(resetUrl: string): Promise<string> {
  return render(<PasswordResetEmail resetUrl={resetUrl} />);
}
