import {createFileRoute} from '@tanstack/react-router';
import {Overview} from '@/components/admin-pages';
import {meta} from '@/lib/support';
export const Route=createFileRoute('/admin/')({head:()=>meta('Admin overview','Student support programme statistics.'),component:Overview});
