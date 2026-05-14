        // Session Check
        document.addEventListener('DOMContentLoaded', () => {
            const loginExpiry = localStorage.getItem('admin_login_expiry');
            if (!loginExpiry || Date.now() > parseInt(loginExpiry)) {
                window.location.href = 'admin-login.html';
            }
        });

        // Data State
        let state = {
            tables: [],
            categories: [],
            menu: []
        };
        let currentStep = 1;

        // UI Elements
        const steps = [
            document.getElementById('step-1'),
            document.getElementById('step-2'),
            document.getElementById('step-3')
        ];
        const tabs = [
            document.getElementById('tab-1'),
            document.getElementById('tab-2'),
            document.getElementById('tab-3')
        ];
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const btnFinish = document.getElementById('btnFinish');
        const stepIndicator = document.getElementById('step-indicator');

        // Navigation Logic
        function updateWizard() {
            steps.forEach((el, i) => {
                if (i + 1 === currentStep) {
                    el.classList.add('active');
                    tabs[i].classList.replace('border-transparent', 'border-indigo-600');
                    tabs[i].classList.replace('text-slate-400', 'text-indigo-600');
                } else {
                    el.classList.remove('active');
                    tabs[i].classList.replace('border-indigo-600', 'border-transparent');
                    tabs[i].classList.replace('text-indigo-600', 'text-slate-400');
                }
            });

            btnPrev.classList.toggle('hidden', currentStep === 1);

            if (currentStep === 3) {
                btnNext.classList.add('hidden');
                btnFinish.classList.remove('hidden');
                updateCategoryDropdown(); // refresh dropdown when entering step 3
            } else {
                btnNext.classList.remove('hidden');
                btnFinish.classList.add('hidden');
            }

            stepIndicator.textContent = `Step ${currentStep} of 3`;
        }

        btnNext.addEventListener('click', () => {
            if (currentStep < 3) { currentStep++; updateWizard(); }
        });
        btnPrev.addEventListener('click', () => {
            if (currentStep > 1) { currentStep--; updateWizard(); }
        });

        btnFinish.addEventListener('click', () => {
            // Save to localStorage
            localStorage.setItem('restaurant_setup_complete', 'true');
            localStorage.setItem('restaurant_tables', JSON.stringify(state.tables));
            localStorage.setItem('restaurant_categories', JSON.stringify(state.categories));
            localStorage.setItem('restaurant_menu', JSON.stringify(state.menu));

            // Redirect to dashboard
            btnFinish.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Launching...';
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1000);
        });

        /* ==================== STEP 1: TABLES DRAG & DROP ==================== */
        const floorPlan = document.getElementById('floor-plan');
        let dragItem = null;
        let active = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        function addTable(shape) {
            const nameInput = document.getElementById('tableName');
            const capInput = document.getElementById('tableCap');

            const name = nameInput.value || `T${state.tables.length + 1}`;
            const cap = capInput.value || 4;
            const id = 'table_' + Date.now();

            // Default center pos
            const x = (floorPlan.offsetWidth / 2) - 40;
            const y = (floorPlan.offsetHeight / 2) - 40;

            const tableData = { id, name, capacity: cap, shape, x, y };
            state.tables.push(tableData);

            renderTable(tableData);
            nameInput.value = ''; // reset
        }

        function renderTable(t) {
            const el = document.createElement('div');
            el.className = `table-element ${t.shape === 'square' ? 'table-square' : 'table-circle'}`;
            el.id = t.id;
            el.style.transform = `translate3d(${t.x}px, ${t.y}px, 0)`;

            el.innerHTML = `
                <span class="table-label">${t.name}</span>
                <span class="table-cap">${t.capacity} pax</span>
                <div class="delete-table-btn" onclick="deleteTable('${t.id}')"><i class="fa-solid fa-xmark"></i></div>
            `;

            floorPlan.appendChild(el);

            // Event Listeners for dragging
            el.addEventListener("mousedown", dragStart, false);
        }

        function deleteTable(id) {
            state.tables = state.tables.filter(t => t.id !== id);
            document.getElementById(id).remove();
        }

        // Dragging Logic
        floorPlan.addEventListener("mousemove", drag, false);
        window.addEventListener("mouseup", dragEnd, false);

        function dragStart(e) {
            if (e.target.classList.contains('delete-table-btn') || e.target.closest('.delete-table-btn')) return;
            dragItem = e.currentTarget;
            const tData = state.tables.find(t => t.id === dragItem.id);

            xOffset = tData.x;
            yOffset = tData.y;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            active = true;
        }

        function drag(e) {
            if (active && dragItem) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                // Bounds checking
                currentX = Math.max(0, Math.min(currentX, floorPlan.offsetWidth - dragItem.offsetWidth));
                currentY = Math.max(0, Math.min(currentY, floorPlan.offsetHeight - dragItem.offsetHeight));

                setTranslate(currentX, currentY, dragItem);
            }
        }

        function dragEnd(e) {
            if (!active) return;
            initialX = currentX;
            initialY = currentY;
            active = false;

            // Update state
            if (dragItem) {
                const tData = state.tables.find(t => t.id === dragItem.id);
                if (tData) {
                    tData.x = currentX;
                    tData.y = currentY;
                }
                dragItem = null;
            }
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        /* ==================== STEP 2: CATEGORIES ==================== */
        const catForm = document.getElementById('categoryForm');
        const catInput = document.getElementById('catInput');
        const catList = document.getElementById('categoriesList');
        const emptyCatMsg = document.getElementById('emptyCatMsg');

        catForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = catInput.value.trim();
            if (val && !state.categories.includes(val)) {
                state.categories.push(val);
                renderCategories();
                catInput.value = '';
            }
        });

        function renderCategories() {
            catList.innerHTML = '';
            if (state.categories.length === 0) {
                catList.appendChild(emptyCatMsg);
                emptyCatMsg.style.display = 'block';
                return;
            }

            emptyCatMsg.style.display = 'none';
            state.categories.forEach(cat => {
                const badge = document.createElement('div');
                badge.className = 'bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 flex items-center shadow-sm';
                badge.innerHTML = `
                    ${cat}
                    <button type="button" onclick="deleteCategory('${cat}')" class="ml-3 text-slate-400 hover:text-rose-500 transition focus:outline-none">
                        <i class="fa-solid fa-circle-xmark"></i>
                    </button>
                `;
                catList.appendChild(badge);
            });
        }

        function deleteCategory(cat) {
            state.categories = state.categories.filter(c => c !== cat);
            renderCategories();
        }

        /* ==================== STEP 3: MENU ==================== */
        const menuForm = document.getElementById('menuForm');
        const dropdown = document.getElementById('dishCategory');
        const mList = document.getElementById('menuList');
        const emptyMenuMsg = document.getElementById('emptyMenuMsg');
        const mCount = document.getElementById('menuCount');

        function updateCategoryDropdown() {
            dropdown.innerHTML = '<option value="">Select a category...</option>';
            state.categories.forEach(cat => {
                dropdown.innerHTML += `<option value="${cat}">${cat}</option>`;
            });
        }

        menuForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dish = {
                id: 'dish_' + Date.now(),
                name: document.getElementById('dishName').value,
                price: parseFloat(document.getElementById('dishPrice').value).toFixed(2),
                category: dropdown.value,
                desc: document.getElementById('dishDesc').value
            };

            state.menu.push(dish);
            renderMenu();
            menuForm.reset();
        });

        function renderMenu() {
            mList.innerHTML = '';
            mCount.textContent = state.menu.length;

            if (state.menu.length === 0) {
                mList.appendChild(emptyMenuMsg);
                emptyMenuMsg.style.display = 'block';
                return;
            }

            emptyMenuMsg.style.display = 'none';
            state.menu.forEach(dish => {
                const card = document.createElement('div');
                card.className = 'bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative group';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-slate-800">${dish.name}</h4>
                        <span class="font-black text-indigo-600">₹${dish.price}</span>
                    </div>
                    <span class="inline-block px-2 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded mb-2">${dish.category}</span>
                    <p class="text-xs text-slate-500 line-clamp-2">${dish.desc || 'No description provided.'}</p>
                    <button onclick="deleteDish('${dish.id}')" class="absolute top-2 right-2 w-8 h-8 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 hover:border-rose-200 shadow-sm opacity-0 group-hover:opacity-100 transition focus:outline-none flex items-center justify-center">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                `;
                mList.appendChild(card);
            });
        }

        function deleteDish(id) {
            state.menu = state.menu.filter(d => d.id !== id);
            renderMenu();
        }
        