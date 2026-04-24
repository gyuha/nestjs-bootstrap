/** 테스트 픽스처 생성을 위한 추상 팩토리 기반 클래스 */
export abstract class BaseFactory<T> {
  /** 단일 객체를 생성한다. 하위 클래스에서 구현한다.
   * @param overrides 기본값을 덮어쓸 부분 필드
   * @returns 생성된 객체
   */
  abstract build(overrides?: Partial<T>): T;

  /** 지정한 개수만큼 객체를 일괄 생성한다.
   * @param count 생성할 객체 수
   * @param overrides 모든 객체에 공통으로 적용할 부분 필드
   * @returns 생성된 객체 배열
   */
  buildMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }
}
