import { Body, Container, Head, Html } from '@react-email/components';

interface BaseLayoutProps {
  children: React.ReactNode;
}

const containerStyle = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif',
  color: '#333',
};

const bodyStyle = {
  backgroundColor: '#f6f9fc',
};

export function BaseLayout({ children }: BaseLayoutProps) {
  return (
    <Html lang="ko">
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>{children}</Container>
      </Body>
    </Html>
  );
}
