import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JComboBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextField;
import javax.swing.ListSelectionModel;
import javax.swing.ScrollPaneConstants;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.table.DefaultTableCellRenderer;
import javax.swing.table.DefaultTableModel;


class Employee implements Comparable<Employee> {

    // Salary rule constants
    static final double HRA_RATE = 0.20;
    static final double DA_RATE = 0.10;
    static final double PF_RATE = 0.12;
    static final double PROFESSIONAL_TAX = 200.0;
    static final double PROFESSIONAL_TAX_LIMIT = 10000.0;

    /** Comparator used to sort employees by basic salary (ascending). */
    static final Comparator<Employee> BY_SALARY = new Comparator<Employee>() {
        @Override
        public int compare(Employee a, Employee b) {
            return Double.compare(a.basicSalary, b.basicSalary);
        }
    };

    private int id;
    private String name;
    private double basicSalary;
    private String department;

    /** Default constructor. */
    public Employee() {
        this(0, "", 0.0, "");
    }

    /** Parameterized constructor. */
    public Employee(int id, String name, double basicSalary, String department) {
        this.id = id;
        this.name = name;
        this.basicSalary = basicSalary;
        this.department = department;
    }

    /** Copy constructor. */
    public Employee(Employee other) {
        this(other.id, other.name, other.basicSalary, other.department);
    }

    // ---------- getters and setters ----------
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getBasicSalary() {
        return basicSalary;
    }

    public void setBasicSalary(double basicSalary) {
        this.basicSalary = basicSalary;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    // ---------- payroll calculations ----------
    public double getAllowances() {
        return basicSalary * (HRA_RATE + DA_RATE);
    }

    public double getDeductions() {
        double tax = (basicSalary > PROFESSIONAL_TAX_LIMIT) ? PROFESSIONAL_TAX : 0.0;
        return basicSalary * PF_RATE + tax;
    }

    /** Net salary = basic salary + allowances - deductions. */
    public double getNetSalary() {
        return basicSalary + getAllowances() - getDeductions();
    }

    // ---------- file support (fields separated by '|') ----------
    public String toFileString() {
        return id + "|" + name + "|" + Double.toString(basicSalary) + "|" + department;
    }

    public static Employee fromFileString(String line) {
        String[] parts = line.split("\\|", -1);
        if (parts.length != 4) {
            throw new IllegalArgumentException("Invalid record: " + line);
        }
        try {
            int id = Integer.parseInt(parts[0].trim());
            String name = parts[1].trim();
            double salary = Double.parseDouble(parts[2].trim());
            String dept = parts[3].trim();
            if (id <= 0 || name.isEmpty() || dept.isEmpty()
                    || Double.isNaN(salary) || Double.isInfinite(salary) || salary <= 0) {
                throw new IllegalArgumentException("Invalid values in record: " + line);
            }
            return new Employee(id, name, salary, dept);
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException("Invalid number in record: " + line, ex);
        }
    }

    // ---------- Comparable : natural ordering = by name, then id ----------
    @Override
    public int compareTo(Employee other) {
        int result = this.name.compareToIgnoreCase(other.name);
        if (result != 0) {
            return result;
        }
        return Integer.compare(this.id, other.id);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }
        return this.id == ((Employee) obj).id;
    }

    @Override
    public int hashCode() {
        return Integer.valueOf(id).hashCode();
    }

    @Override
    public String toString() {
        return "Employee[id=" + id + ", name=" + name + ", basic=" + basicSalary
                + ", dept=" + department + "]";
    }
}


    private JPanel buildHeader() {
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.setBackground(NAVY);
        header.setBorder(BorderFactory.createEmptyBorder(14, 22, 14, 22));

        JLabel title = new JLabel("Employee Payroll System");
        title.setFont(new Font("SansSerif", Font.BOLD, 24));
        title.setForeground(Color.WHITE);

        JLabel subtitle = new JLabel("Manage employee records, calculate net salary and save payroll data");
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 13));
        subtitle.setForeground(new Color(180, 200, 225));

        header.add(title);
        header.add(Box.createVerticalStrut(3));
        header.add(subtitle);
        return header;
    }

    /** Left sidebar: input form, net salary preview and action buttons. */
    private JScrollPane buildSidebar() {
        JPanel side = new JPanel();
        side.setLayout(new BoxLayout(side, BoxLayout.Y_AXIS));
        side.setBackground(Color.WHITE);
        side.setBorder(BorderFactory.createEmptyBorder(14, 18, 14, 18));

        // ----- input fields -----
        idField = new JTextField();
        nameField = new JTextField();
        salaryField = new JTextField();
        deptCombo = new JComboBox<String>(DEPARTMENTS);
        styleField(idField);
        styleField(nameField);
        styleField(salaryField);
        deptCombo.setFont(BASE_FONT);
        deptCombo.setBackground(Color.WHITE);
        deptCombo.setAlignmentX(Component.LEFT_ALIGNMENT);
        deptCombo.setPreferredSize(new Dimension(220, 32));
        deptCombo.setMaximumSize(new Dimension(Integer.MAX_VALUE, 32));

        side.add(sectionTitle("EMPLOYEE DETAILS"));
        side.add(fieldLabel("Employee ID"));
        side.add(idField);
        side.add(fieldLabel("Full Name"));
        side.add(nameField);
        side.add(fieldLabel("Basic Salary (Rs.)"));
        side.add(salaryField);
        side.add(fieldLabel("Department"));
        side.add(deptCombo);

        // ----- net salary preview card -----
        previewLabel = new JLabel();
        previewLabel.setFont(BASE_FONT);
        previewLabel.setForeground(TEXT_DARK);
        JPanel card = new JPanel(new BorderLayout());
        card.setBackground(new Color(230, 245, 242));
        card.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(160, 210, 202)),
                BorderFactory.createEmptyBorder(6, 10, 6, 10)));
        card.add(previewLabel, BorderLayout.CENTER);
        card.setAlignmentX(Component.LEFT_ALIGNMENT);
        card.setMaximumSize(new Dimension(Integer.MAX_VALUE, 66));
        card.setPreferredSize(new Dimension(220, 66));
        resetPreview();

        side.add(Box.createVerticalStrut(10));
        side.add(sectionTitle("NET SALARY PREVIEW"));
        side.add(Box.createVerticalStrut(6));
        side.add(card);

        // ----- buttons -----
        JButton addButton = makeButton("Add Employee", ACCENT);
        JButton saveButton = makeButton("Save", BLUE);
        JButton loadButton = makeButton("Load", BLUE);
        JButton viewButton = makeButton("View All", BLUE);
        JButton clearButton = makeButton("Clear Form", SOFT_RED);
        JButton sortNameButton = makeButton("Sort by Name", GREY);
        JButton sortSalaryButton = makeButton("Sort by Salary", GREY);

        addButton.setAlignmentX(Component.LEFT_ALIGNMENT);
        addButton.setMaximumSize(new Dimension(Integer.MAX_VALUE, 38));
        addButton.setPreferredSize(new Dimension(220, 38));

        JPanel grid = new JPanel(new GridLayout(3, 2, 8, 8));
        grid.setOpaque(false);
        grid.add(saveButton);
        grid.add(loadButton);
        grid.add(viewButton);
        grid.add(clearButton);
        grid.add(sortNameButton);
        grid.add(sortSalaryButton);
        grid.setAlignmentX(Component.LEFT_ALIGNMENT);
        grid.setPreferredSize(new Dimension(220, 3 * 34 + 2 * 8));
        grid.setMaximumSize(new Dimension(Integer.MAX_VALUE, 3 * 34 + 2 * 8));

        side.add(Box.createVerticalStrut(12));
        side.add(sectionTitle("ACTIONS"));
        side.add(Box.createVerticalStrut(8));
        side.add(addButton);
        side.add(Box.createVerticalStrut(8));
        side.add(grid);
        side.add(Box.createVerticalGlue());

        // ----- event handling (ActionListener written as lambdas) -----
        addButton.addActionListener(e -> addEmployee());
        saveButton.addActionListener(e -> saveToFile());
        loadButton.addActionListener(e -> loadFromFile(true));
        viewButton.addActionListener(e -> viewAll());
        clearButton.addActionListener(e -> clearForm());
        sortNameButton.addActionListener(e -> sortByName());
        sortSalaryButton.addActionListener(e -> sortBySalary());

        // live net salary preview while typing the salary
        salaryField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                updatePreview();
            }

            @Override
            public void removeUpdate(DocumentEvent e) {
                updatePreview();
            }

            @Override
            public void changedUpdate(DocumentEvent e) {
                updatePreview();
            }
        });

        JScrollPane scroll = new JScrollPane(side,
                ScrollPaneConstants.VERTICAL_SCROLLBAR_AS_NEEDED,
                ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        scroll.setBorder(BorderFactory.createMatteBorder(0, 0, 0, 1, new Color(215, 222, 232)));
        scroll.getVerticalScrollBar().setUnitIncrement(16);
        scroll.getViewport().setBackground(Color.WHITE);
        scroll.setPreferredSize(new Dimension(320, 100));
        return scroll;
    }

    /** Centre panel: payroll table. */
    private JPanel buildTablePanel() {
        tableModel = new DefaultTableModel(COLUMNS, 0) {
            private static final long serialVersionUID = 1L;

            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // read-only table
            }
        };

        table = new JTable(tableModel);
        table.setFont(BASE_FONT);
        table.setForeground(TEXT_DARK);
        table.setRowHeight(30);
        table.setShowGrid(false);
        table.setIntercellSpacing(new Dimension(0, 0));
        table.setFillsViewportHeight(true);
        table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        table.setSelectionBackground(new Color(190, 220, 245));
        table.setSelectionForeground(Color.BLACK);
        table.getTableHeader().setReorderingAllowed(false);
        table.getTableHeader().setPreferredSize(new Dimension(100, 34));

        // custom header look
        table.getTableHeader().setDefaultRenderer(new DefaultTableCellRenderer() {
            private static final long serialVersionUID = 1L;

            @Override
            public Component getTableCellRendererComponent(JTable t, Object value,
                    boolean isSelected, boolean hasFocus, int row, int column) {
                super.getTableCellRendererComponent(t, value, false, false, row, column);
                setBackground(NAVY);
                setForeground(Color.WHITE);
                setFont(BOLD_FONT);
                setOpaque(true);
                setHorizontalAlignment(isNumericColumn(column) ? SwingConstants.RIGHT : SwingConstants.LEFT);
                setBorder(BorderFactory.createEmptyBorder(0, 10, 0, 10));
                return this;
            }
        });

        // striped body cells (last column = net salary, shown bold and green)
        for (int i = 0; i < COLUMNS.length; i++) {
            int align = isNumericColumn(i) ? SwingConstants.RIGHT : SwingConstants.LEFT;
            table.getColumnModel().getColumn(i).setCellRenderer(new StripedRenderer(align, i == 6));
        }
        int[] widths = {50, 170, 120, 105, 105, 105, 105};
        for (int i = 0; i < widths.length; i++) {
            table.getColumnModel().getColumn(i).setPreferredWidth(widths[i]);
        }

        JScrollPane scroll = new JScrollPane(table);
        scroll.setBorder(BorderFactory.createLineBorder(new Color(215, 222, 232)));
        scroll.getViewport().setBackground(Color.WHITE);

        JLabel heading = new JLabel("Payroll Records");
        heading.setFont(new Font("SansSerif", Font.BOLD, 16));
        heading.setForeground(NAVY);
        heading.setBorder(BorderFactory.createEmptyBorder(0, 0, 8, 0));

        JPanel panel = new JPanel(new BorderLayout());
        panel.setBackground(PAGE_BG);
        panel.setBorder(BorderFactory.createEmptyBorder(16, 16, 12, 16));
        panel.add(heading, BorderLayout.NORTH);
        panel.add(scroll, BorderLayout.CENTER);
        return panel;
    }

    /** Bottom bar: status message on the left, payroll totals on the right. */
    private JPanel buildStatusBar() {
        statusLabel = new JLabel("Ready.");
        statusLabel.setFont(BASE_FONT);
        statusLabel.setForeground(TEXT_DARK);

        summaryLabel = new JLabel();
        summaryLabel.setFont(BOLD_FONT);
        summaryLabel.setForeground(NAVY);

        JPanel bar = new JPanel(new BorderLayout());
        bar.setBackground(new Color(228, 234, 242));
        bar.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(1, 0, 0, 0, new Color(205, 213, 225)),
                BorderFactory.createEmptyBorder(7, 16, 7, 16)));
        bar.add(statusLabel, BorderLayout.WEST);
        bar.add(summaryLabel, BorderLayout.EAST);
        updateSummary();
        return bar;
    }

    // ----- small UI factory helpers -----
    private JLabel sectionTitle(String text) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("SansSerif", Font.BOLD, 11));
        label.setForeground(new Color(120, 132, 148));
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        return label;
    }

    private JLabel fieldLabel(String text) {
        JLabel label = new JLabel(text);
        label.setFont(BOLD_FONT);
        label.setForeground(TEXT_DARK);
        label.setBorder(BorderFactory.createEmptyBorder(7, 0, 3, 0));
        label.setAlignmentX(Component.LEFT_ALIGNMENT);
        return label;
    }

    private void styleField(JTextField field) {
        field.setFont(BASE_FONT);
        field.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(new Color(190, 198, 210)),
                BorderFactory.createEmptyBorder(4, 8, 4, 8)));
        field.setAlignmentX(Component.LEFT_ALIGNMENT);
        field.setPreferredSize(new Dimension(220, 32));
        field.setMaximumSize(new Dimension(Integer.MAX_VALUE, 32));
    }

    private JButton makeButton(String text, Color background) {
        JButton button = new JButton(text);
        button.setFont(BOLD_FONT);
        button.setBackground(background);
        button.setForeground(Color.WHITE);
        button.setOpaque(true);
        button.setFocusPainted(false);
        button.setBorder(BorderFactory.createEmptyBorder(8, 10, 8, 10));
        button.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return button;
    }

    private static boolean isNumericColumn(int column) {
        return column == 0 || column >= 3;
    }

    /** Table cell renderer with alternating row colours. */
    private static class StripedRenderer extends DefaultTableCellRenderer {
        private static final long serialVersionUID = 1L;
        private static final Color NET_GREEN = new Color(0, 110, 70);
        private final boolean highlight;

        StripedRenderer(int alignment, boolean highlight) {
            this.highlight = highlight;
            setHorizontalAlignment(alignment);
        }

        @Override
        public Component getTableCellRendererComponent(JTable t, Object value,
                boolean isSelected, boolean hasFocus, int row, int column) {
            super.getTableCellRendererComponent(t, value, isSelected, false, row, column);
            setBorder(BorderFactory.createEmptyBorder(0, 10, 0, 10));
            setFont(highlight ? BOLD_FONT : BASE_FONT);
            if (!isSelected) {
                setBackground(row % 2 == 0 ? Color.WHITE : STRIPE);
                setForeground(highlight ? NET_GREEN : TEXT_DARK);
            }
            return this;
        }
    }

    private void addEmployee() {
        String idText = idField.getText().trim();
        String name = nameField.getText().trim();
        String salaryText = salaryField.getText().trim();
        String dept = (String) deptCombo.getSelectedItem();

        if (idText.isEmpty() || name.isEmpty() || salaryText.isEmpty()) {
            showError("Please fill in Employee ID, Name and Basic Salary.");
            return;
        }

        int id;
        try {
            id = Integer.parseInt(idText);
        } catch (NumberFormatException ex) {
            showError("Employee ID must be a whole number.");
            idField.requestFocus();
            return;
        }
        if (id <= 0) {
            showError("Employee ID must be greater than zero.");
            idField.requestFocus();
            return;
        }

        if (!name.matches("[\\p{L}][\\p{L} .'-]*")) {
            showError("Name may contain only letters, spaces, dots, apostrophes and hyphens.");
            nameField.requestFocus();
            return;
        }

        Double salary = parseSalary(salaryText);
        if (salary == null) {
            showError("Basic Salary must be a number greater than 0 (maximum 1,000,000,000).");
            salaryField.requestFocus();
            return;
        }

        if (findById(employees, id) != null) {
            showError("An employee with ID " + id + " already exists.");
            idField.requestFocus();
            return;
        }

        Employee emp = new Employee(id, name, salary.doubleValue(), dept);
        employees.add(emp);
        refreshTable();
        clearForm();

        setStatus("Employee added: " + emp.getName());
        JOptionPane.showMessageDialog(this,
                "Employee added successfully!\n\n"
                        + "Name        : " + emp.getName() + "\n"
                        + "Department  : " + emp.getDepartment() + "\n"
                        + "Basic Salary: " + money(emp.getBasicSalary()) + "\n"
                        + "Allowances  : " + money(emp.getAllowances()) + "\n"
                        + "Deductions  : " + money(emp.getDeductions()) + "\n"
                        + "Net Salary  : " + money(emp.getNetSalary()),
                "Payroll Generated", JOptionPane.INFORMATION_MESSAGE);
    }

    /** Saves every employee to employees.txt using FileWriter (wrapped in BufferedWriter). */
    private void saveToFile() {
        if (employees.isEmpty()) {
            JOptionPane.showMessageDialog(this, "There are no employee records to save.",
                    "Nothing to Save", JOptionPane.INFORMATION_MESSAGE);
            return;
        }
        File file = new File(FILE_NAME);
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
            for (Employee emp : employees) {
                writer.write(emp.toFileString());
                writer.newLine();
            }
        } catch (IOException ex) {
            showError("Could not save the file:\n" + ex.getMessage());
            return;
        }
        setStatus(employees.size() + " record(s) saved to " + file.getAbsolutePath());
        JOptionPane.showMessageDialog(this,
                employees.size() + " record(s) saved to:\n" + file.getAbsolutePath(),
                "Saved", JOptionPane.INFORMATION_MESSAGE);
    }

    /** Loads employees from employees.txt using BufferedReader (wrapped around FileReader). */
    private void loadFromFile(boolean interactive) {
        File file = new File(FILE_NAME);
        if (!file.exists()) {
            if (interactive) {
                JOptionPane.showMessageDialog(this,
                        "File not found:\n" + file.getAbsolutePath()
                                + "\n\nAdd employees and click Save first.",
                        "File Not Found", JOptionPane.WARNING_MESSAGE);
            }
            setStatus("No saved file found. Start by adding employees.");
            return;
        }

        List<Employee> loaded = new ArrayList<Employee>();
        int skipped = 0;

        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                try {
                    Employee emp = Employee.fromFileString(line);
                    if (findById(loaded, emp.getId()) != null) {
                        skipped++; // duplicate ID
                    } else {
                        loaded.add(emp);
                    }
                } catch (IllegalArgumentException ex) {
                    skipped++; // malformed line
                }
            }
        } catch (IOException ex) {
            showError("Could not read the file:\n" + ex.getMessage());
            return;
        }

        employees.clear();
        employees.addAll(loaded);
        refreshTable();

        String message = loaded.size() + " record(s) loaded from " + FILE_NAME;
        if (skipped > 0) {
            message += " (" + skipped + " invalid/duplicate line(s) skipped)";
        }
        setStatus(message);
        if (interactive) {
            JOptionPane.showMessageDialog(this, message, "Loaded", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void viewAll() {
        refreshTable();
        if (employees.isEmpty()) {
            setStatus("No employee records to display.");
            JOptionPane.showMessageDialog(this, "No employee records available.",
                    "View All", JOptionPane.INFORMATION_MESSAGE);
        } else {
            setStatus("Showing all " + employees.size() + " employee record(s).");
        }
    }

    /** Sort by name using Comparable (Employee.compareTo). */
    private void sortByName() {
        Collections.sort(employees);
        refreshTable();
        setStatus("Sorted by name (Comparable).");
    }

    /** Sort by salary using a Comparator. */
    private void sortBySalary() {
        Collections.sort(employees, Employee.BY_SALARY);
        refreshTable();
        setStatus("Sorted by basic salary, low to high (Comparator).");
    }

    private void clearForm() {
        idField.setText("");
        nameField.setText("");
        salaryField.setText("");
        deptCombo.setSelectedIndex(0);
        resetPreview();
        idField.requestFocus();
    }

    // ------------------------------------------------------------------
    //  Helpers
    // ------------------------------------------------------------------
    private void refreshTable() {
        tableModel.setRowCount(0);
        for (Employee emp : employees) {
            tableModel.addRow(new Object[] {
                Integer.valueOf(emp.getId()),
                emp.getName(),
                emp.getDepartment(),
                money(emp.getBasicSalary()),
                money(emp.getAllowances()),
                money(emp.getDeductions()),
                money(emp.getNetSalary())
            });
        }
        updateSummary();
    }

    private void updateSummary() {
        double total = 0.0;
        for (Employee emp : employees) {
            total += emp.getNetSalary();
        }
        summaryLabel.setText("Employees: " + employees.size()
                + "     Total Net Payroll: Rs. " + money(total));
    }

    private void resetPreview() {
        previewLabel.setText("<html><i>Type a basic salary to see<br>allowances, deductions and net pay.</i></html>");
    }

    private void updatePreview() {
        Double salary = parseSalary(salaryField.getText().trim());
        if (salary == null) {
            resetPreview();
        } else {
            Employee temp = new Employee(1, "Preview", salary.doubleValue(), "");
            previewLabel.setText("<html>Allowances: Rs. " + money(temp.getAllowances())
                    + "<br>Deductions: Rs. " + money(temp.getDeductions())
                    + "<br><b>Net Salary: Rs. " + money(temp.getNetSalary()) + "</b></html>");
        }
    }

    /** Returns the salary, or null when the text is not a valid positive number. */
    private static Double parseSalary(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }
        try {
            double value = Double.parseDouble(text);
            if (Double.isNaN(value) || Double.isInfinite(value) || value <= 0 || value > MAX_SALARY) {
                return null;
            }
            return Double.valueOf(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private static Employee findById(List<Employee> list, int id) {
        for (Employee emp : list) {
            if (emp.getId() == id) {
                return emp;
            }
        }
        return null;
    }

    private static String money(double value) {
        return String.format(Locale.US, "%.2f", value);
    }

    private void setStatus(String text) {
        statusLabel.setText(text);
    }

    private void showError(String message) {
        JOptionPane.showMessageDialog(this, message, "Error", JOptionPane.ERROR_MESSAGE);
    }


    //  Entry point
    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                try {
                    // Cross-platform look and feel so the custom colours look the same everywhere
                    UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
                } catch (Exception ex) {
                    // fall back to the default look and feel
                }
                new EmployeePayrollSystem().setVisible(true);
            }
        });
    }
}