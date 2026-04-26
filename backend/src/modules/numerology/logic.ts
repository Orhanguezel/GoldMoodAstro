export function calculateLifePath(dob: string) {
  const digits = dob.replace(/-/g, '');
  let sum = digits.split('').reduce((acc, d) => acc + parseInt(d, 10), 0);

  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum
      .toString()
      .split('')
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }

  return sum;
}
