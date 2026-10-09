import {createFileRoute} from '@tanstack/react-router';
import {Services} from '@/components/admin-pages';
import {meta} from '@/lib/support';
export const Route=createFileRoute('/admin/services')({head:()=>meta('Services','Manage monthly support service prices.'),component:Services});
