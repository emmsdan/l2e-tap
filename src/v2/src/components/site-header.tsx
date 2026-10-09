import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import logo from '@/assets/learn2earnlogo.svg.asset.json';
export function SiteHeader(){return <header className="site-header"><div className="site-width"><Link to="/" aria-label="Learn2Earn home"><img src={logo.url} alt="Learn2Earn" className="brand-logo"/></Link><nav><Button variant="ghost" asChild><Link to="/dashboard">My dashboard</Link></Button><Button asChild><Link to="/register">Get started</Link></Button></nav></div></header>}
export function SiteFooter(){return <footer className="site-footer"><div className="site-width"><img src={logo.url} alt="Learn2Earn" className="brand-logo"/><span>Learn now. Earn your future.</span><span>© 2026 Learn2Earn</span></div></footer>}
