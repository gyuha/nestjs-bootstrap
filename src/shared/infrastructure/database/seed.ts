/** 데이터베이스 초기 데이터를 삽입하는 시드 함수 */
async function seed(): Promise<void> {
  console.log('Starting seed...');
  // Phase 3~4에서 각 도메인 시더 추가
  console.log('Seeding complete');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
