"use client";
import { useState } from "react";
import { login } from "../lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    setError(null);
    try {
      const data = await login(email, password);
     localStorage.setItem("access_token", data.access);
      router.push("/");
    } catch (e:any){
      setError(e.message || "Login failed");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="card-body space-y-4">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <form className="space-y-3" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Password</label>
              <input type="password" className="w-full rounded-md border border-gray-300 px-3 py-2" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary w-full" type="submit">Sign in</button>
          </form>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <p className="text-xs text-gray-500">Use the admin account you created in the backend step.</p>
        </div>
      </div>
    </div>
  );
}
