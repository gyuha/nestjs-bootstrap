import { Button, Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  confirmUrl: string;
}

const buttonStyle = {
  backgroundColor: '#6f42c1',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '4px',
  textDecoration: 'none',
  display: 'inline-block',
};

export function SubscriptionConfirmEmail({ confirmUrl }: Props) {
  return (
    <BaseLayout>
      <Preview>마케팅 수신 동의 확인</Preview>
      <Heading>마케팅 수신 동의</Heading>
      <Text>마케팅 이메일 수신을 신청해 주셨습니다. 아래 버튼으로 최종 확인해 주세요.</Text>
      <Button href={confirmUrl} style={buttonStyle}>수신 동의하기</Button>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        이 링크는 48시간 동안 유효합니다. 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderSubscriptionConfirm(confirmUrl: string): Promise<string> {
  return render(<SubscriptionConfirmEmail confirmUrl={confirmUrl} />);
}
