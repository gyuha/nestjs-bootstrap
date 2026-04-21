import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

export function AccountDeactivationEmail() {
  return (
    <BaseLayout>
      <Preview>계정 비활성화 예정 안내</Preview>
      <Heading>계정 비활성화 예정</Heading>
      <Text>귀하의 계정이 곧 비활성화될 예정입니다. 계속 사용하시려면 로그인해 주세요.</Text>
      <Text style={{ color: '#999', fontSize: '12px' }}>
        문의사항이 있으시면 고객지원으로 연락해 주세요.
      </Text>
    </BaseLayout>
  );
}

export async function renderAccountDeactivation(): Promise<string> {
  return render(<AccountDeactivationEmail />);
}
