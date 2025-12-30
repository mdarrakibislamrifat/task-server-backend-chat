import Task from "../models/Task.js";
import excelJS from "exceljs";
import User from "../models/User.js";

const exportTasksReport = async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email");
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Tasks Report");
    worksheet.columns = [
      { header: "Tasks ID", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "Priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ];

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} (${user.email})`)
        .join(", ");
      worksheet.addRow({
        _id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate.toString().split("T")[0],
        assignedTo: assignedTo || "Unassigned",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + "tasks_report.xlsx",
    );

    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error exporting tasks report", error: error.message });
  }
};

const exportUsersReport = async (req, res) => {
  try {
    // 1. Get all users first so everyone appears in the report
    const users = await User.find().select("name email _id").lean();
    const userTasks = await Task.find().populate(
      "assignedTo",
      "name email _id",
    );

    const userTaskMap = {};

    // 2. Initialize the map using the USERS list
    users.forEach((user) => {
      // Use .toString() to ensure the ID key is a string for reliable matching
      userTaskMap[user._id.toString()] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
      };
    });

    // 3. Process tasks and increment counts for assigned users
    userTasks.forEach((task) => {
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach((assignedUser) => {
          const userIdStr = assignedUser._id.toString();

          if (userTaskMap[userIdStr]) {
            userTaskMap[userIdStr].taskCount += 1;

            // Match the status exactly as defined in your system
            if (task.status === "Pending") {
              userTaskMap[userIdStr].pendingTasks += 1;
            } else if (task.status === "In Progress") {
              userTaskMap[userIdStr].inProgressTasks += 1;
            } else if (task.status === "Completed") {
              userTaskMap[userIdStr].completedTasks += 1;
            }
          }
        });
      }
    });

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users Task Report");

    worksheet.columns = [
      { header: "User Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Total Assigned Tasks", key: "taskCount", width: 20 },
      { header: "Pending Tasks", key: "pendingTasks", width: 20 },
      { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
      { header: "Completed Tasks", key: "completedTasks", width: 20 },
    ];

    // 4. Object.values gives us the actual data objects to add to rows
    Object.values(userTaskMap).forEach((userData) => {
      worksheet.addRow(userData);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users_report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    console.error("Export Error:", error);
    res
      .status(500)
      .json({ message: "Error exporting users report", error: error.message });
  }
};

export { exportTasksReport, exportUsersReport };
