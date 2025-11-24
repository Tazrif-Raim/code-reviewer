import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("tweets").select();
  
  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
