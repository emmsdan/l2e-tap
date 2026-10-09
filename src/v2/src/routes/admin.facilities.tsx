import {createFileRoute} from '@tanstack/react-router';
import {Facilities} from '@/components/admin-pages';
import {meta} from '@/lib/support';
export const Route=createFileRoute('/admin/facilities')({head:()=>meta('Facilities','Manage learning hubs, rooms and accommodation.'),component:Facilities});
