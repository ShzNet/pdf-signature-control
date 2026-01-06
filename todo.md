# Task Checklist - @shz/pdf-sign-control

- [x] **Phase 1: Project & Demo Environment Setup** <!-- id: 0 -->
    - [x] Create `@shz/pdf-sign-control` (Core Lib) <!-- id: 1 -->
    - [x] Create `@shz/pdf-sign-react` (React Wrapper) <!-- id: 2 -->
    - [x] Create `@shz/pdf-sign-angular` (Angular Wrapper) <!-- id: 4 -->
    - [x] Create `@shz/pdf-sign-standalone` (Vanilla JS Wrapper) <!-- id: 5 -->
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

- [ ] **Phase 3: View Modes (Scroll vs Single)** <!-- id: 17 -->
    - [ ] Implement `SinglePageStrategy` <!-- id: 18 -->
    - [ ] Implement `ScrollStrategy` (Virtual Scrolling) <!-- id: 19 -->
    - [ ] Implement `ZoomManager` <!-- id: 20 -->
    - [ ] **Verification**:
        - [ ] Check Zoom/Scroll in React <!-- id: 21 -->
        - [ ] Check Zoom/Scroll in Angular <!-- id: 23 -->
        - [ ] Check Zoom/Scroll in Vanilla <!-- id: 24 -->

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
