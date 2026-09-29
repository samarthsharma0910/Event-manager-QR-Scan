import Nav from '../components/Nav'; import Footer from '../components/Footer';
export const metadata={title:'Community Bridge Events',description:'Community event registration and attendance management'};
export default function RootLayout({children}){return <html lang="en"><body style={{margin:0,background:'#f8f7f2',color:'#1f2923',fontFamily:'Arial, Helvetica, sans-serif'}}><Nav/><main>{children}</main><Footer/></body></html>}
