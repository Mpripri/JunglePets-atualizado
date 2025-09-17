// cadastro_database.js - Sistema de banco de dados para JunglePets

// Classe para gerenciar o banco de dados de usuários
class UserDatabase {
    constructor() {
        this.storageKey = 'junglepets_users';
        this.currentUserKey = 'junglepets_current_user';
    }

    // Inicializar banco de dados
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    // Buscar todos os usuários
    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return [];
        }
    }

    // Salvar usuário no banco
    saveUser(userData) {
        try {
            const users = this.getAllUsers();
            
            // Verificar se email já existe
            const emailExists = users.some(user => user.email === userData.email);
            if (emailExists) {
                throw new Error('Email já cadastrado');
            }

            // Criar novo usuário com ID único
            const newUser = {
                id: this.generateId(),
                name: userData.name,
                email: userData.email,
                password: this.hashPassword(userData.password), // Hash simples da senha
                whats: userData.whats || '',
                cpf: userData.cpf || '',
                pet: userData.pet || '',
                newsletter: userData.newsletter || false,
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            users.push(newUser);
            localStorage.setItem(this.storageKey, JSON.stringify(users));
            
            return newUser;
        } catch (error) {
            throw error;
        }
    }

    // Autenticar usuário
    authenticateUser(email, password) {
        try {
            const users = this.getAllUsers();
            const hashedPassword = this.hashPassword(password);
            
            const user = users.find(u => 
                u.email === email && u.password === hashedPassword
            );

            if (user) {
                // Atualizar último login
                user.lastLogin = new Date().toISOString();
                this.updateUser(user);
                this.setCurrentUser(user);
                return user;
            }
            
            return null;
        } catch (error) {
            console.error('Erro na autenticação:', error);
            return null;
        }
    }

    // Atualizar dados do usuário
    updateUser(updatedUser) {
        try {
            const users = this.getAllUsers();
            const index = users.findIndex(u => u.id === updatedUser.id);
            
            if (index !== -1) {
                users[index] = { ...users[index], ...updatedUser };
                localStorage.setItem(this.storageKey, JSON.stringify(users));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return false;
        }
    }

    // Buscar usuário por email
    getUserByEmail(email) {
        const users = this.getAllUsers();
        return users.find(user => user.email === email);
    }

    // Definir usuário atual
    setCurrentUser(user) {
        // Remover senha antes de salvar na sessão
        const userSession = { ...user };
        delete userSession.password;
        localStorage.setItem(this.currentUserKey, JSON.stringify(userSession));
    }

    // Obter usuário atual
    getCurrentUser() {
        try {
            const userSession = localStorage.getItem(this.currentUserKey);
            return userSession ? JSON.parse(userSession) : null;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }

    // Logout
    logout() {
        localStorage.removeItem(this.currentUserKey);
    }

    // Hash simples da senha (em produção, use bcrypt ou similar)
    hashPassword(password) {
        // Hash simples usando btoa (Base64)
        // NOTA: Em produção, use uma biblioteca de criptografia adequada
        return btoa(password + 'junglepets_salt');
    }

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Limpar todos os dados (para desenvolvimento)
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.currentUserKey);
        this.init();
    }

    // Exportar dados (backup)
    exportData() {
        return {
            users: this.getAllUsers(),
            currentUser: this.getCurrentUser(),
            exportDate: new Date().toISOString()
        };
    }

    // Estatísticas do banco
    getStats() {
        const users = this.getAllUsers();
        return {
            totalUsers: users.length,
            usersWithPets: users.filter(u => u.pet).length,
            newsletterSubscribers: users.filter(u => u.newsletter).length,
            recentUsers: users.filter(u => {
                const createdDate = new Date(u.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return createdDate > weekAgo;
            }).length
        };
    }
}

// JavaScript atualizado para cadastro.html
document.addEventListener("DOMContentLoaded", function () {
    // Inicializar banco de dados
    const userDB = new UserDatabase();
    userDB.init();

    // Referencias aos elementos
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const panelLogin = document.getElementById('panel-login');
    const panelRegister = document.getElementById('panel-register');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginAlert = document.getElementById('loginAlert');
    const regAlert = document.getElementById('regAlert');
    const toLoginBtn = document.getElementById('toLogin');

    // Verificar se usuário já está logado
    const currentUser = userDB.getCurrentUser();
    if (currentUser) {
        showUserProfile(currentUser);
    }

    // Gerenciamento de abas
    function switchTab(showLogin = true) {
        if (showLogin) {
            tabLogin.setAttribute('aria-selected', 'true');
            tabRegister.setAttribute('aria-selected', 'false');
            panelLogin.hidden = false;
            panelRegister.hidden = true;
        } else {
            tabLogin.setAttribute('aria-selected', 'false');
            tabRegister.setAttribute('aria-selected', 'true');
            panelLogin.hidden = true;
            panelRegister.hidden = false;
        }
        clearAlerts();
    }

    // Event listeners para abas
    tabLogin.addEventListener('click', () => switchTab(true));
    tabRegister.addEventListener('click', () => switchTab(false));
    toLoginBtn.addEventListener('click', () => switchTab(true));

    // Função para mostrar alertas
    function showAlert(element, message, type = 'error') {
        element.textContent = message;
        element.className = `alert ${type}`;
        element.style.display = 'block';
        
        // Auto-hide após 5 segundos
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    // Função para limpar alertas
    function clearAlerts() {
        loginAlert.style.display = 'none';
        regAlert.style.display = 'none';
    }

    // Handle Login
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearAlerts();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || !password) {
            showAlert(loginAlert, "Por favor, preencha todos os campos!");
            return;
        }

        try {
            const user = userDB.authenticateUser(email, password);
            
            if (user) {
                showAlert(loginAlert, "Login realizado com sucesso!", "success");
                setTimeout(() => {
                    showUserProfile(user);
                }, 1500);
            } else {
                showAlert(loginAlert, "Email ou senha incorretos!");
            }
        } catch (error) {
            showAlert(loginAlert, "Erro interno. Tente novamente.");
            console.error('Erro no login:', error);
        }
    });

    // Handle Register
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearAlerts();

        const formData = {
            name: document.getElementById("name").value.trim(),
            whats: document.getElementById("whats").value.trim(),
            email: document.getElementById("email").value.trim(),
            cpf: document.getElementById("cpf").value.trim(),
            password: document.getElementById("password").value,
            confirm: document.getElementById("confirm").value,
            pet: document.getElementById("pet").value.trim(),
            newsletter: document.getElementById("newsletter").checked,
            terms: document.getElementById("terms").checked
        };

        // Validações
        if (!formData.name || !formData.email || !formData.password || !formData.confirm) {
            showAlert(regAlert, "Por favor, preencha todos os campos obrigatórios!");
            return;
        }

        if (!formData.terms) {
            showAlert(regAlert, "Você deve aceitar os Termos de Uso!");
            return;
        }

        if (formData.password !== formData.confirm) {
            showAlert(regAlert, "As senhas não coincidem!");
            return;
        }

        if (formData.password.length < 6) {
            showAlert(regAlert, "A senha deve ter pelo menos 6 caracteres!");
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            showAlert(regAlert, "Por favor, insira um email válido!");
            return;
        }

        // Validar CPF se fornecido
        if (formData.cpf && !/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
            showAlert(regAlert, "CPF deve conter 11 dígitos!");
            return;
        }

        try {
            const newUser = userDB.saveUser(formData);
            showAlert(regAlert, "Cadastro realizado com sucesso!", "success");
            
            // Limpar formulário
            registerForm.reset();
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
                switchTab(true);
            }, 2000);

        } catch (error) {
            if (error.message === 'Email já cadastrado') {
                showAlert(regAlert, "Este email já está cadastrado!");
            } else {
                showAlert(regAlert, "Erro ao realizar cadastro. Tente novamente.");
                console.error('Erro no cadastro:', error);
            }
        }
    });

    // Mostrar perfil do usuário logado
    function showUserProfile(user) {
        const profileHTML = `
            <div class="user-profile">
                <h3>Bem-vindo(a), ${user.name}!</h3>
                <p><strong>Email:</strong> ${user.email}</p>
                ${user.pet ? `<p><strong>Pet:</strong> ${user.pet}</p>` : ''}
                <p><strong>Membro desde:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                <div style="margin-top: 20px;">
                    <button class="btn btn-ghost" onclick="logout()">Sair</button>
                    <button class="btn" onclick="window.location.href='junglepets_enhanced.html'">Ir às Compras</button>
                </div>
            </div>
        `;

        // Esconder formulários e mostrar perfil
        document.querySelector('.card-body').innerHTML = profileHTML;
        document.querySelector('.card-title').textContent = `Olá, ${user.name.split(' ')[0]}!`;
    }

    // Função de logout (global)
    window.logout = function() {
        userDB.logout();
        location.reload();
    };

    // Função para mostrar/esconder senha
    document.querySelectorAll('[data-toggle]').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-toggle');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = 'ocultar';
            } else {
                input.type = 'password';
                this.textContent = 'mostrar';
            }
        });
    });

    // Medidor de força da senha
    const passwordInput = document.getElementById('password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthHint = document.getElementById('strengthHint');

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            updateStrengthMeter(strength);
        });
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return score;
    }

    function updateStrengthMeter(strength) {
        const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Forte'];
        const colors = ['#ff4444', '#ff8800', '#ffbb00', '#88cc00', '#44cc00'];
        
        strengthHint.textContent = `Força da senha: ${levels[strength] || '—'}`;
        if (strengthBar) {
            strengthBar.style.width = `${(strength + 1) * 20}%`;
            strengthBar.style.backgroundColor = colors[strength] || '#ddd';
        }
    }

    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            this.value = value;
        });
    }

    // Máscara para WhatsApp
    const whatsInput = document.getElementById('whats');
    if (whatsInput) {
        whatsInput.addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            value = value.replace(/^(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
            this.value = value;
        });
    }

    // Debug: Adicionar controles de desenvolvimento (remover em produção)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Modo desenvolvimento ativo');
        
        // Adicionar botões de debug
        const debugDiv = document.createElement('div');
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.right = '10px';
        debugDiv.style.background = '#333';
        debugDiv.style.color = '#fff';
        debugDiv.style.padding = '10px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.fontSize = '12px';
        debugDiv.innerHTML = `
            <strong>Debug:</strong><br>
            <button onclick="console.log(userDB.getAllUsers())">Ver Usuários</button>
            <button onclick="console.log(userDB.getStats())">Estatísticas</button>
            <button onclick="userDB.clearAllData(); location.reload()">Limpar DB</button>
        `;
        
        // Tornar userDB global para debug
        window.userDB = userDB;
        
        document.body.appendChild(debugDiv);
    }

    // Atualizar ano no footer
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});

// Estilos CSS adicionais para o sistema
const additionalStyles = `
.alert {
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 15px;
    font-weight: bold;
}

.alert.error {
    background-color: #fee;
    border: 1px solid #fcc;
    color: #c33;
}

.alert.success {
    background-color: #efe;
    border: 1px solid #cfc;
    color: #3c3;
}

.user-profile {
    padding: 20px;
    text-align: center;
    background-color: #f9f9f9;
    border-radius: 10px;
}

.user-profile h3 {
    color: #1b4d3e;
    margin-bottom: 15px;
}

.user-profile p {
    margin-bottom: 10px;
    color: #666;
}

.meter {
    width: 100%;
    height: 4px;
    background-color: #ddd;
    border-radius: 2px;
    overflow: hidden;
    margin-top: 5px;
}

.meter i {
    display: block;
    height: 100%;
    background-color: #ddd;
    width: 0%;
    transition: all 0.3s ease;
}

.suffix-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 0.85rem;
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
}

.input {
    position: relative;
}
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);