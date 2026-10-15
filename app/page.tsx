import {redirect} from "next/navigation";
import {owner} from "@/lib/auth/server";
import Workbench from "./Workbench";
export const dynamic="force-dynamic";
export default async function Page(){const id=await owner();if(!id)redirect("/login");return <Workbench/>;}
