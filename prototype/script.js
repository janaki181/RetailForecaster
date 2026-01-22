// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]:not(#openAuth)').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== HEADER SCROLL EFFECT ====================
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        header.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        header.style.background = 'rgba(255, 255, 255, 0.95)';
    }
    
    lastScroll = currentScroll;
});

// ==================== INTERSECTION OBSERVER FOR ANIMATIONS ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.aim-card, .impact-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// ==================== CTA BUTTON INTERACTIONS ====================
document.querySelectorAll('.cta-button').forEach(button => {
    button.addEventListener('click', function() {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.width = '100px';
        ripple.style.height = '100px';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple 0.6s ease-out';
        
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
        
        // Scroll to dashboard or (for login) open modal via separate handler; avoid demo alert for login/sign up
        const text = this.textContent.trim();
        if (text.includes('Dashboard')) {
            document.querySelector('#dashboard').scrollIntoView({ behavior: 'smooth' });
        } else if (text.includes('Login') || text.includes('Sign Up')) {
            const overlay = document.getElementById('authOverlay');
            if (overlay) {
              overlay.classList.add('active');
              document.body.classList.add('no-scroll');
            }
        } else {
            alert('Feature coming soon! This is a demo landing page.');
        }
    });
});

const userIdInput = document.getElementById('userIdInput');
const userIdError = document.getElementById('userIdError');

userIdInput.addEventListener('input', function () {
    const value = this.value.trim();

    if (value.length > 0 && value.length < 3) {
        userIdError.style.display = 'block';
        this.style.border = '2px solid red';
    } else {
        userIdError.style.display = 'none';
        this.style.border = '2px solid #ccc';
    }
});

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        from {
            transform: scale(0);
            opacity: 1;
        }
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== CHART.JS FOR DASHBOARD PREVIEW ====================
// Load Chart.js
const chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
chartScript.onload = initPreviewChart;
document.head.appendChild(chartScript);

function initPreviewChart() {
    const ctx = document.getElementById('previewChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Sales',
                data: [32, 45, 38, 52, 48, 55, 62],
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y + 'K';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value + 'K';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ==================== FEATURE CARD ANIMATION ====================
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02) rotate(1deg)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1) rotate(0deg)';
    });
});

// ==================== LOADING ANIMATION ====================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('🚀 RetailForecaster - Landing Page Loaded');
console.log('✨ Modern, Premium, Interview-Ready');

// ==================== AUTH MODAL LOGIC ====================
document.addEventListener('DOMContentLoaded', () => {
    const authOverlay = document.getElementById('authOverlay');
    const closeAuth = document.getElementById('closeAuth');
    const openAuthButtons = document.querySelectorAll('#openAuth');

    const toggleAuth = document.getElementById('toggleAuth');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authButton = document.getElementById('authButton');
    const confirmPassword = document.getElementById('confirmPasswordGroup');

    let isSignup = false;

    openAuthButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (authOverlay) {
                authOverlay.classList.add('active');
                document.body.classList.add('no-scroll');
            }
        });
    });

    if (closeAuth && authOverlay) {
        closeAuth.onclick = () => {
            authOverlay.classList.remove('active');
            document.body.classList.remove('no-scroll');
        };
    }

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && closeAuth) closeAuth.click();
    });

    if (toggleAuth) {
        toggleAuth.onclick = () => {
            isSignup = !isSignup;
            authTitle.textContent = isSignup ? 'Create Account' : 'Welcome Back';
            authSubtitle.textContent = isSignup
                ? 'Sign up to start forecasting smarter'
                : 'Log in to continue to RetailForecaster';

            authButton.textContent = isSignup ? 'Create Account' : 'Log In';
            toggleAuth.textContent = isSignup ? 'Log in' : 'Sign up';

            confirmPassword.classList.toggle('hidden');
        };
    }

    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.onsubmit = (e) => {
            e.preventDefault();
            localStorage.setItem('rf_auth', 'true');
            // Redirect to protected dashboard page
            window.location.href = 'dashboard.html';
        };
    }

    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('passwordInput');
    if (togglePassword && passwordInput) {
        togglePassword.onclick = () => {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
        };
    }
});
