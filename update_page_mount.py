with open('app/page.tsx', 'r') as f:
    content = f.read()

target = """const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function Page() {
  const isMounted = useIsMounted();"""

replacement = """export default function Page() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);"""

if target in content:
    content = content.replace(target, replacement)
    with open('app/page.tsx', 'w') as f:
        f.write(content)
    print("Updated isMounted logic")
else:
    print("Target not found")
