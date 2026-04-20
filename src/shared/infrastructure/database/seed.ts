async function seed(): Promise<void> {
  console.log('Starting seed...');
  // Phase 3~4에서 각 도메인 시더 추가
  console.log('Seeding complete');
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
