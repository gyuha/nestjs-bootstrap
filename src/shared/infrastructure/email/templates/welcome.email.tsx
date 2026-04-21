import { Heading, Preview, Text } from '@react-email/components';
import { render } from '@react-email/render';
import { BaseLayout } from './base.layout';

interface Props {
  name?: string;
}

export function WelcomeEmail({ name }: Props) {
  return (
    <BaseLayout>
      <Preview>환영합니다!</Preview>
      <Heading>환영합니다{name ? `, ${name}` : ''}!</Heading>
      <Text>가입을 환영합니다. 이제 서비스를 자유롭게 이용하세요.</Text>
    </BaseLayout>
  );
}

export async function renderWelcome(name?: string): Promise<string> {
  return render(<WelcomeEmail name={name} />);
}
