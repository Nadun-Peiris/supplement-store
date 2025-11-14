import Link from "next/link";
import "./styles/footer.css";
import { FaInstagram, FaFacebookF, FaTiktok } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="footer">
      {/* Top Section */}
      <div className="footer-container">
        {/* Branch Info */}
        <div className="footer-col">
          <h4>MAIN BRANCH</h4>
          <div className="footer-row">
            <span>🏢</span>
            <p>No 271, Thalawathugoda Road,<br />Sri Jayawardenepura Kotte</p>
          </div>
          <div className="footer-row">
            <span>📞</span>
            <a href="tel:+94777658483">+94 77 765 8483</a>
          </div>
          <div className="footer-row">
            <span>✉️</span>
            <a href="mailto:info@supplement.com">info@supplement.com</a>
          </div>
        </div>

        {/* Shop */}
        <div className="footer-col">
          <h4>SHOP</h4>
          <ul>
            <li><Link href="/new">New Arrivals</Link></li>
            <li><Link href="/best-sellers">Best Sellers</Link></li>
            <li><Link href="/categories">Categories</Link></li>
            <li><Link href="/sale">Promotions</Link></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="footer-col">
          <h4>CUSTOMER CARE</h4>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/outlets">Outlets</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div className="footer-col">
          <h4>MORE INFO</h4>
          <ul>
            <li><Link href="/policy/privacy">Privacy Policy</Link></li>
            <li><Link href="/policy/terms">Terms & Conditions</Link></li>
            <li><Link href="/policy/returns">Return & Refund</Link></li>
            <li><Link href="/policy/shipping">Shipping</Link></li>
          </ul>
        </div>
      </div>

      {/* Middle Section */}
      <div className="footer-divider">
        <div className="line" />
        <div className="footer-logo">
          <img src="/logo.png" alt="Supplement Store" />
        </div>
        <div className="line" />
      </div>

      {/* Bottom Section */}
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} <span>Supplement Lanka PVT LTD</span>.
          All rights reserved. Developed by Nadun Peiris.
        </p>

        <div className="footer-social">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <FaFacebookF />
          </a>
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <FaTiktok />
          </a>
        </div>
      </div>
    </footer>
  );
}
