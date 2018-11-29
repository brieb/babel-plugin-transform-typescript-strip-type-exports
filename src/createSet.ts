export function createSet() {
  const setObj: { [value: string]: true | undefined } = {};
  return {
    add(value: string): void {
      setObj[value] = true;
    },
    remove(value: string): void {
      delete setObj[value];
    },
    has(value: string): boolean {
      return !!setObj[value];
    }
  };
}
