import java.util.Locale;

/**
 * Employee model class for the Payroll System.
 *
 * Demonstrates: default, parameterized and copy constructors (CO1).
 *
 * Net Salary = Basic Salary + Allowances - Deductions
 *   Allowances = HRA (20% of basic) + DA (10% of basic)
 *   Deductions = PF  (12% of basic) + Tax (5% of basic)
 */
public class Employee {

    // Payroll rates (as fractions of basic salary)
    public static final double HRA_RATE = 0.20;
    public static final double DA_RATE = 0.10;
    public static final double PF_RATE = 0.12;
    public static final double TAX_RATE = 0.05;

    // File format delimiter
    public static final String DELIMITER = "|";

    private int id;
    private String name;
    private double basicSalary;
    private String department;

    /** Default constructor. */
    public Employee() {
        this.id = 0;
        this.name = "";
        this.basicSalary = 0.0;
        this.department = "";
    }

    /** Parameterized constructor. */
    public Employee(int id, String name, double basicSalary, String department) {
        this.id = id;
        this.name = (name == null) ? "" : name;
        this.basicSalary = basicSalary;
        this.department = (department == null) ? "" : department;
    }

    /** Copy constructor. */
    public Employee(Employee other) {
        this.id = other.id;
        this.name = other.name;
        this.basicSalary = other.basicSalary;
        this.department = other.department;
    }

    // ---------------------------------------------------------------
    // Getters and setters
    // ---------------------------------------------------------------
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
        this.name = (name == null) ? "" : name;
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
        this.department = (department == null) ? "" : department;
    }

    // ---------------------------------------------------------------
    // Payroll calculations
    // ---------------------------------------------------------------
    public double getHra() {
        return basicSalary * HRA_RATE;
    }

    public double getDa() {
        return basicSalary * DA_RATE;
    }

    public double getPf() {
        return basicSalary * PF_RATE;
    }

    public double getTax() {
        return basicSalary * TAX_RATE;
    }

    /** Total allowances = HRA + DA. */
    public double getAllowances() {
        return getHra() + getDa();
    }

    /** Total deductions = PF + Tax. */
    public double getDeductions() {
        return getPf() + getTax();
    }

    /** Net salary = basic salary + allowances - deductions. */
    public double getNetSalary() {
        return basicSalary + getAllowances() - getDeductions();
    }

    // ---------------------------------------------------------------
    // File support
    // ---------------------------------------------------------------

    /** Converts this employee to one line of text: id|name|basicSalary|department */
    public String toFileString() {
        return id + DELIMITER + name + DELIMITER + basicSalary + DELIMITER + department;
    }

    /**
     * Builds an Employee from a line produced by toFileString().
     * Uses the default constructor followed by setters.
     *
     * @return the Employee, or null if the line is malformed
     */
    public static Employee fromFileString(String line) {
        if (line == null) {
            return null;
        }
        String[] parts = line.split("\\|", -1);
        if (parts.length != 4) {
            return null;
        }
        try {
            int id = Integer.parseInt(parts[0].trim());
            String name = parts[1].trim();
            double salary = Double.parseDouble(parts[2].trim());
            String dept = parts[3].trim();

            if (id <= 0 || name.isEmpty() || dept.isEmpty()) {
                return null;
            }
            if (Double.isNaN(salary) || Double.isInfinite(salary) || salary < 0) {
                return null;
            }

            Employee e = new Employee(); // default constructor
            e.setId(id);
            e.setName(name);
            e.setBasicSalary(salary);
            e.setDepartment(dept);
            return e;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @Override
    public String toString() {
        return String.format(Locale.US,
                "Employee[ID=%d, Name=%s, Dept=%s, Basic=%.2f, Net=%.2f]",
                id, name, department, basicSalary, getNetSalary());
    }
}
