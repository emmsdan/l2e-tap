import {createFileRoute} from '@tanstack/react-router';
import {Readers} from '@/components/admin-pages';
import {meta} from '@/lib/support';
export const Route=createFileRoute('/admin/readers')({head:()=>meta('Card readers','Manage NFC reader assignments and status.'),component:Readers});
