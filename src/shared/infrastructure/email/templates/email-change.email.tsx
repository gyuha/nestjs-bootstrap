import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
  newEmail: string;
}

const buttonStyle = {
  backgroundColor: '#28a745',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function EmailChangeEmail({ confirmUrl, newEmail }: Props) {
  return (
    <BaseLayout>
      <Preview>이메일 주소 변경 확인</Preview>
      <Heading>이메일 변경 확인</Heading>
      <Text>{newEmail}(으)로 이메일 주소 변경을 요청하셨습니다.</Text>
      <Button href={confirmUrl} style={buttonStyle}>변경 확인하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 24시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderEmailChange(confirmUrl: string, newEmail: string): Promise<string> {
  return render(<EmailChangeEmail confirmUrl={confirmUrl} newEmail={newEmail} />);
}
