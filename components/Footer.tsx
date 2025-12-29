import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

export const Footer = () => {
    return (
        <footer className="mt-20 bg-brand-bg shadow-neu-outset pt-16 pb-8 border-t border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="text-2xl font-bold tracking-tight text-brand-primary">
                            MEDDIGEST
                        </Link>
                        <p className="mt-4 text-gray-500 text-sm max-w-sm">
                            Empowering the next generation of medical professionals with accessible, high-quality education.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            {[FaFacebook, FaTwitter, FaInstagram, FaLinkedin].map((Icon, idx) => (
                                <a key={idx} href="#" className="h-10 w-10 rounded-full shadow-neu-outset flex items-center justify-center text-gray-400 hover:text-brand-primary active:shadow-neu-pressed transition-all">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">Platform</h3>
                        <ul className="space-y-3">
                            {['Courses', 'Instructors', 'Pricing', 'Login'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-base text-gray-500 hover:text-brand-primary transition-colors">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 tracking-wider uppercase mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Support'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-base text-gray-500 hover:text-brand-primary transition-colors">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200/50 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center bg-brand-bg">
                    <p className="text-base text-gray-400 text-center md:text-left">
                        &copy; {new Date().getFullYear()} MediDigest by Skynet Multipurpose. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
