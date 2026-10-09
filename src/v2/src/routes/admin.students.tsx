import {createFileRoute} from '@tanstack/react-router';
import {Students} from '@/components/admin-pages';
import {meta} from '@/lib/support';
export const Route=createFileRoute('/admin/students')({head:()=>meta('Students','Manage students and NFC card assignments.'),component:Students});
