# Task Checklist - @shznet/pdf-sign-control

- [x] **Phase 1: Project & Demo Environment Setup** <!-- id: 0 -->
    - [x] Create `@shznet/pdf-sign-control` (Core Lib) <!-- id: 1 -->
    - [x] Create `@shznet/pdf-sign-react` (React Wrapper) <!-- id: 2 -->
    - [x] Create `@shznet/pdf-sign-angular` (Angular Wrapper) <!-- id: 4 -->
    - [x] Create `@shznet/pdf-sign-standalone` (Vanilla JS Wrapper) <!-- id: 5 -->
    - [x] **Setup Demos**:
        - [x] Create `apps/demo-react` and link wrapper <!-- id: 6 -->
        - [x] Create `apps/demo-angular` and link wrapper <!-- id: 8 -->
        - [x] Create `apps/demo-vanilla` (Standalone) <!-- id: 9 -->

- [x] **Phase 2: PDF Viewer Engine (Core Rendering)** <!-- id: 10 -->
    - [x] Implement `PdfLoader` & `PdfViewer` (Core) <!-- id: 11 -->
    - [x] Implement `CanvasLayer` (PDF.js rendering) <!-- id: 12 -->
    - [x] **Verification**:
        - [x] Vanilla: Load & Render PDF <!-- id: 13 -->
        - [x] React: Component renders PDF <!-- id: 14 -->
        - [x] Angular: Module renders PDF <!-- id: 16 -->

- [x] **Phase 3: View Modes (Scroll vs Single)** <!-- id: 17 -->
    - [x] Implement `SinglePageStrategy` <!-- id: 18 -->
    - [x] Implement `ScrollStrategy` (Virtual Scrolling) <!-- id: 19 -->
    - [x] Implement `ZoomManager` (Gesture Zoom & Optimized Rendering) <!-- id: 20 -->
    - [x] **Verification**:
        - [x] Check Zoom/Scroll in React <!-- id: 21 -->
        - [x] Check Zoom/Scroll in Angular <!-- id: 23 -->
        - [x] Check Zoom/Scroll in Vanilla <!-- id: 24 -->

- [x] **Phase 3.5: UI Redesign & Critical Bug Fixes**
    - [x] **3-Panel Layout**: Redesigned all demos (Toolbox, Viewer, Properties)
    - [x] **Bug Fixes**:
        - [x] Initial Scroll Position (ScrollTop Reset)
        - [x] Top Content Clipping (justify-content fix)
        - [x] React Zoom Consistency (State Persistence)
        - [x] React Double-Load Race Condition
        - [x] Partial Zoom (Zombie Render & Parallel Placeholders)
        - [x] Angular UI Mismatch (Host Display & Global Reset)

- [ ] **Phase 4: Signature Field System (Interactions)** <!-- id: 25 -->
    - [ ] Implement `SignatureLayer` (DOM Overlay) <!-- id: 26 -->
    - [ ] Implement `DragHandler` & `ResizeHandler` <!-- id: 27 -->
    - [ ] Implement Coordinate Conversion (Pixel <-> PDF Point) <!-- id: 28 -->
    - [ ] **Verification**:
        - [ ] Test Drag/Drop in React <!-- id: 29 -->
        - [ ] Test Drag/Drop in Angular <!-- id: 31 -->
        - [ ] Test Drag/Drop in Vanilla <!-- id: 32 -->

- [ ] **Phase 5: Advanced Features & Polish** <!-- id: 33 -->
    - [ ] Implement Field Types (Text vs HTML Content) <!-- id: 34 -->
    - [ ] Implement Field Options (Lock, ReadOnly) <!-- id: 35 -->
    - [ ] Performance Tuning (Render Queue, Throttling) <!-- id: 36 -->
    - [ ] **Final QA**:
        - [ ] Run Full Regression on all apps <!-- id: 37 -->

- [ ] **Phase 6: Documentation & Release** <!-- id: 38 -->
    - [ ] Write API Docs <!-- id: 39 -->
    - [ ] Prepare Release Config (NX Release) <!-- id: 40 -->
