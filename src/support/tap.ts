export default function tap<T>(value: T, callback: (value: T) => void): T {
  callback(value);

  return value;
}
