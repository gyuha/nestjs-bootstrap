import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
}

const buttonStyle = {
  backgroundColor: '#007bff',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function SignupConfirmationEmail({ confirmUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>이메일 주소를 확인해 주세요</Preview>
      <Heading>이메일 확인</Heading>
      <Text>회원가입을 완료하려면 아래 버튼을 클릭하세요.</Text>
      <Button href={confirmUrl} style={buttonStyle}>이메일 확인하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 24시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderSignupConfirmation(confirmUrl: string): Promise<string> {
  return render(<SignupConfirmationEmail confirmUrl={confirmUrl} />);
}
