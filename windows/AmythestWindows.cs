using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;

namespace Amythest.Windows
{
    internal static class Palette
    {
        public static readonly Color Background = Color.FromArgb(32, 39, 69);
        public static readonly Color Card = Color.FromArgb(246, 247, 252);
        public static readonly Color Ink = Color.FromArgb(36, 48, 79);
        public static readonly Color Muted = Color.FromArgb(95, 107, 134);
        public static readonly Color Lilac = Color.FromArgb(96, 72, 148);
        public static readonly Color Border = Color.FromArgb(156, 166, 204);
        public static readonly Color White = Color.FromArgb(251, 250, 255);
    }

    internal sealed class GlassStrip : Panel
    {
        public GlassStrip() { DoubleBuffered = true; BackColor = Palette.Background; }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            Rectangle rect = new Rectangle(0, 0, Math.Max(1, Width), Math.Max(1, Height));
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, Color.FromArgb(119, 105, 176), Color.FromArgb(47, 48, 100), LinearGradientMode.Vertical))
                e.Graphics.FillRectangle(brush, rect);
            using (SolidBrush sheen = new SolidBrush(Color.FromArgb(38, 255, 255, 255)))
                e.Graphics.FillRectangle(sheen, 0, 0, Width, Height / 2);
            using (Pen top = new Pen(Color.FromArgb(170, 255, 255, 255))) e.Graphics.DrawLine(top, 0, 0, Width, 0);
            using (Pen bottom = new Pen(Color.FromArgb(26, 24, 61))) e.Graphics.DrawLine(bottom, 0, Height - 1, Width, Height - 1);
        }
    }

    internal enum CaptionAction { Minimize, Maximize, Close }

    internal sealed class CaptionButton : Control
    {
        private bool hot;
        private bool down;
        public CaptionAction Action { get; private set; }
        public CaptionButton(CaptionAction action)
        {
            Action = action;
            SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.UserPaint | ControlStyles.Selectable, true);
            TabStop = true;
            Size = new Size(action == CaptionAction.Close ? 58 : 34, 23);
            Cursor = Cursors.Hand;
            AccessibleRole = AccessibleRole.PushButton;
            AccessibleName = action == CaptionAction.Maximize ? "Maximize or restore" : action.ToString();
        }
        protected override void OnMouseEnter(EventArgs e) { hot = true; Invalidate(); base.OnMouseEnter(e); }
        protected override void OnMouseLeave(EventArgs e) { hot = false; down = false; Invalidate(); base.OnMouseLeave(e); }
        protected override void OnMouseDown(MouseEventArgs e) { down = true; Invalidate(); base.OnMouseDown(e); }
        protected override void OnMouseUp(MouseEventArgs e) { down = false; Invalidate(); base.OnMouseUp(e); }
        protected override void OnKeyDown(KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter || e.KeyCode == Keys.Space) { OnClick(EventArgs.Empty); e.Handled = true; }
            base.OnKeyDown(e);
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(0, 0, Width - 1, Height - 1);
            bool close = Action == CaptionAction.Close;
            Color top = close ? (hot ? Color.FromArgb(255, 194, 172) : Color.FromArgb(240, 167, 153)) :
                hot ? Color.FromArgb(213, 241, 255) : Color.FromArgb(163, 203, 235);
            Color bottom = close ? (down ? Color.FromArgb(150, 42, 34) : Color.FromArgb(184, 58, 47)) :
                down ? Color.FromArgb(47, 102, 153) : Color.FromArgb(48, 109, 164);
            using (GraphicsPath path = Ui.CaptionShape(rect, Action))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, top, bottom, LinearGradientMode.Vertical))
            using (Pen border = new Pen(close ? Color.FromArgb(119, 49, 48) : Color.FromArgb(39, 82, 129)))
            {
                e.Graphics.FillPath(brush, path);
                e.Graphics.DrawPath(border, path);
            }
            using (Pen shine = new Pen(Color.FromArgb(190, 255, 255, 255)))
                e.Graphics.DrawLine(shine, close ? 2 : 2, 2, Width - 3, 2);
            using (Pen glyph = new Pen(Color.White, 1.8f))
            {
                glyph.StartCap = LineCap.Square;
                glyph.EndCap = LineCap.Square;
                int cx = Width / 2, cy = Height / 2;
                if (Action == CaptionAction.Minimize) e.Graphics.DrawLine(glyph, cx - 5, cy + 4, cx + 5, cy + 4);
                else if (Action == CaptionAction.Close)
                {
                    e.Graphics.DrawLine(glyph, cx - 5, cy - 5, cx + 5, cy + 5);
                    e.Graphics.DrawLine(glyph, cx + 5, cy - 5, cx - 5, cy + 5);
                }
                else if (FindForm() != null && FindForm().WindowState == FormWindowState.Maximized)
                {
                    e.Graphics.DrawRectangle(glyph, cx - 3, cy - 5, 9, 8);
                    e.Graphics.DrawRectangle(glyph, cx - 6, cy - 2, 9, 8);
                }
                else e.Graphics.DrawRectangle(glyph, cx - 5, cy - 4, 10, 9);
            }
            if (Focused) ControlPaint.DrawFocusRectangle(e.Graphics, new Rectangle(4, 4, Width - 8, Height - 8));
        }
    }

    internal sealed class AeroCaption : Panel
    {
        public readonly CaptionButton MinimizeButton = new CaptionButton(CaptionAction.Minimize);
        public readonly CaptionButton MaximizeButton = new CaptionButton(CaptionAction.Maximize);
        public readonly CaptionButton CloseButton = new CaptionButton(CaptionAction.Close);
        public AeroCaption()
        {
            DoubleBuffered = true;
            Height = 35;
            BackColor = Color.FromArgb(116, 160, 204);
            Controls.Add(MinimizeButton);
            Controls.Add(MaximizeButton);
            Controls.Add(CloseButton);
            Resize += delegate {
                CloseButton.SetBounds(Width - 62, 4, 58, 23);
                MaximizeButton.SetBounds(Width - 96, 4, 34, 23);
                MinimizeButton.SetBounds(Width - 130, 4, 34, 23);
            };
        }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            Rectangle rect = new Rectangle(0, 0, Math.Max(1, Width), Math.Max(1, Height));
            using (LinearGradientBrush glass = new LinearGradientBrush(rect, Color.FromArgb(222, 240, 250), Color.FromArgb(105, 158, 205), LinearGradientMode.Vertical))
                e.Graphics.FillRectangle(glass, rect);
            using (SolidBrush reflection = new SolidBrush(Color.FromArgb(85, 255, 255, 255)))
                e.Graphics.FillRectangle(reflection, 1, 1, Width - 2, 15);
            using (Pen light = new Pen(Color.FromArgb(220, 255, 255, 255))) e.Graphics.DrawLine(light, 1, 1, Width - 2, 1);
            using (Pen edge = new Pen(Color.FromArgb(54, 100, 155))) e.Graphics.DrawLine(edge, 0, Height - 1, Width, Height - 1);
        }
    }

    internal sealed class LogoMark : Control
    {
        public LogoMark()
        {
            SetStyle(ControlStyles.SupportsTransparentBackColor | ControlStyles.UserPaint | ControlStyles.AllPaintingInWmPaint, true);
            DoubleBuffered = true;
            Size = new Size(48, 48);
            BackColor = Color.Transparent;
        }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            e.Graphics.ScaleTransform(Width / 128f, Height / 128f);
            using (GraphicsPath outer = new GraphicsPath())
            using (GraphicsPath center = new GraphicsPath())
            {
                outer.StartFigure();
                outer.AddBezier(66, 15, 85, 13, 99, 27, 109, 48);
                outer.AddBezier(109, 48, 118, 67, 118, 86, 105, 100);
                outer.AddBezier(105, 100, 91, 115, 67, 116, 46, 113);
                outer.AddBezier(46, 113, 27, 110, 14, 97, 12, 81);
                outer.AddBezier(12, 81, 9, 65, 24, 46, 37, 31);
                outer.AddBezier(37, 31, 47, 20, 56, 16, 66, 15);
                outer.CloseFigure();
                center.StartFigure();
                center.AddBezier(67, 37, 79, 35, 89, 44, 95, 58);
                center.AddBezier(95, 58, 99, 67, 105, 75, 101, 82);
                center.AddBezier(101, 82, 99, 88, 92, 92, 86, 95);
                center.AddBezier(86, 95, 78, 99, 70, 101, 63, 102);
                center.AddBezier(63, 102, 52, 103, 38, 96, 33, 90);
                center.AddBezier(33, 90, 28, 82, 32, 72, 41, 61);
                center.AddBezier(41, 61, 48, 51, 55, 38, 67, 37);
                center.CloseFigure();
                using (LinearGradientBrush opal = new LinearGradientBrush(new Rectangle(9, 11, 112, 109), Color.White, Color.FromArgb(170, 162, 206), LinearGradientMode.Vertical))
                    e.Graphics.FillPath(opal, outer);
                using (LinearGradientBrush amethyst = new LinearGradientBrush(new Rectangle(32, 36, 74, 70), Color.FromArgb(239, 211, 255), Color.FromArgb(80, 38, 154), LinearGradientMode.Vertical))
                    e.Graphics.FillPath(amethyst, center);
                using (Pen edge = new Pen(Color.FromArgb(176, 154, 206), 1.8f)) e.Graphics.DrawPath(edge, outer);
                using (Pen shine = new Pen(Color.FromArgb(190, 255, 255, 255), 3f))
                    e.Graphics.DrawBezier(shine, 25, 59, 33, 35, 53, 22, 64, 20);
            }
        }
    }

    internal sealed class AeroTabs : TabControl
    {
        public AeroTabs()
        {
            DrawMode = TabDrawMode.OwnerDrawFixed;
            SizeMode = TabSizeMode.Fixed;
            ItemSize = new Size(142, 34);
            Font = new Font("Segoe UI", 10, FontStyle.Bold);
        }
        protected override void OnDrawItem(DrawItemEventArgs e)
        {
            bool selected = e.Index == SelectedIndex;
            Rectangle rect = GetTabRect(e.Index);
            Color top = selected ? Color.FromArgb(250, 251, 255) : Color.FromArgb(157, 155, 197);
            Color bottom = selected ? Color.FromArgb(230, 235, 249) : Color.FromArgb(111, 105, 159);
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, top, bottom, LinearGradientMode.Vertical)) e.Graphics.FillRectangle(brush, rect);
            using (Pen edge = new Pen(Color.FromArgb(112, 118, 166))) e.Graphics.DrawRectangle(edge, rect.Left, rect.Top, rect.Width - 1, rect.Height - 1);
            Color textColor = selected ? Palette.Ink : Color.White;
            TextRenderer.DrawText(e.Graphics, TabPages[e.Index].Text, Font, rect, textColor, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter);
        }
    }

    internal sealed class AeroCard : Panel
    {
        public AeroCard() { DoubleBuffered = true; BackColor = Palette.Card; }
        protected override void OnPaintBackground(PaintEventArgs e)
        {
            e.Graphics.Clear(Palette.Background);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(1, 1, Width - 3, Height - 3);
            if (rect.Width <= 0 || rect.Height <= 0) return;
            using (GraphicsPath path = Ui.RoundRect(rect, 16))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, Color.FromArgb(224, 226, 246), Palette.Card, LinearGradientMode.Vertical))
            using (Pen border = new Pen(Palette.Border))
            {
                e.Graphics.FillPath(brush, path);
                e.Graphics.DrawPath(border, path);
            }
            using (Pen shine = new Pen(Color.FromArgb(220, 255, 255, 255))) e.Graphics.DrawLine(shine, 18, 2, Width - 19, 2);
        }
    }

    internal sealed class AeroButton : Button
    {
        private bool hover;
        private bool pressed;
        public AeroButton()
        {
            FlatStyle = FlatStyle.Flat;
            FlatAppearance.BorderSize = 0;
            Cursor = Cursors.Hand;
            Font = new Font("Segoe UI", 10, FontStyle.Bold);
            ForeColor = Color.FromArgb(39, 27, 75);
        }
        protected override void OnMouseEnter(EventArgs e) { hover = true; Invalidate(); base.OnMouseEnter(e); }
        protected override void OnMouseLeave(EventArgs e) { hover = false; pressed = false; Invalidate(); base.OnMouseLeave(e); }
        protected override void OnMouseDown(MouseEventArgs e) { pressed = true; Invalidate(); base.OnMouseDown(e); }
        protected override void OnMouseUp(MouseEventArgs e) { pressed = false; Invalidate(); base.OnMouseUp(e); }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.Clear(Parent == null ? Palette.Background : Parent.BackColor);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle rect = new Rectangle(1, 1, Width - 3, Height - 4);
            if (rect.Width <= 0 || rect.Height <= 0) return;
            Color top = pressed ? Color.FromArgb(170, 196, 232) : hover ? Color.FromArgb(255, 255, 255) : Color.FromArgb(255, 255, 255);
            Color bottom = pressed ? Color.FromArgb(225, 235, 250) : hover ? Color.FromArgb(170, 207, 246) : Color.FromArgb(198, 211, 242);
            using (GraphicsPath path = Ui.RoundRect(rect, 9))
            using (LinearGradientBrush brush = new LinearGradientBrush(rect, top, bottom, LinearGradientMode.Vertical))
            using (Pen border = new Pen(hover ? Color.FromArgb(69, 145, 222) : Color.FromArgb(133, 163, 231), 1.5f))
            {
                e.Graphics.FillPath(brush, path);
                e.Graphics.DrawPath(border, path);
            }
            using (GraphicsPath shadow = Ui.RoundRect(new Rectangle(2, Height - 4, Width - 4, 3), 2))
            using (SolidBrush shade = new SolidBrush(Color.FromArgb(70, 90, 146, 226))) e.Graphics.FillPath(shade, shadow);
            TextRenderer.DrawText(e.Graphics, Text, Font, rect, ForeColor, TextFormatFlags.HorizontalCenter | TextFormatFlags.VerticalCenter | TextFormatFlags.EndEllipsis);
            if (Focused) ControlPaint.DrawFocusRectangle(e.Graphics, new Rectangle(6, 5, Width - 12, Height - 12));
        }
    }

    internal sealed class GoalBar : Control
    {
        private double fraction;
        public double Fraction { get { return fraction; } set { fraction = Math.Max(0, Math.Min(1, value)); Invalidate(); } }
        public GoalBar() { DoubleBuffered = true; Height = 12; }
        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            using (SolidBrush track = new SolidBrush(Color.FromArgb(183, 189, 215))) e.Graphics.FillRectangle(track, 0, 0, Width, Height);
            int fill = (int)(Width * fraction);
            if (fill > 0)
            {
                using (LinearGradientBrush brush = new LinearGradientBrush(new Rectangle(0, 0, fill, Height), Color.FromArgb(172, 180, 246), Color.FromArgb(111, 80, 180), LinearGradientMode.Horizontal))
                    e.Graphics.FillRectangle(brush, 0, 0, fill, Height);
                using (Pen shine = new Pen(Color.FromArgb(155, 255, 255, 255))) e.Graphics.DrawLine(shine, 0, 1, fill, 1);
            }
        }
    }

    internal sealed class HourChart : Control
    {
        private long[] hours = new long[24];
        public long[] Hours { set { hours = value == null || value.Length != 24 ? new long[24] : (long[])value.Clone(); Invalidate(); } }
        public HourChart() { DoubleBuffered = true; BackColor = Palette.Card; AccessibleName = "Hourly Windows activity chart"; }
        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            int chartTop = 7, chartBottom = Math.Max(8, Height - 22);
            using (Pen grid = new Pen(Color.FromArgb(211, 216, 232)))
            {
                e.Graphics.DrawLine(grid, 0, chartBottom, Width, chartBottom);
                e.Graphics.DrawLine(grid, 0, (chartTop + chartBottom) / 2, Width, (chartTop + chartBottom) / 2);
            }
            long maximum = Math.Max(60000, hours.Max());
            float slot = Width / 24f;
            for (int hour = 0; hour < 24; hour++)
            {
                int barHeight = (int)Math.Round((double)hours[hour] / maximum * (chartBottom - chartTop));
                if (barHeight > 0)
                {
                    Rectangle rect = new Rectangle((int)(hour * slot + slot * .19f), chartBottom - barHeight, Math.Max(2, (int)(slot * .62f)), barHeight);
                    using (LinearGradientBrush brush = new LinearGradientBrush(rect, Color.FromArgb(176, 156, 230), Color.FromArgb(97, 76, 163), LinearGradientMode.Vertical))
                        e.Graphics.FillRectangle(brush, rect);
                }
            }
            using (Font labelFont = new Font("Segoe UI", 8))
            {
                foreach (int hour in new[] { 0, 6, 12, 18 })
                    TextRenderer.DrawText(e.Graphics, hour == 0 ? "12a" : hour == 12 ? "12p" : (hour % 12) + (hour < 12 ? "a" : "p"), labelFont,
                        new Rectangle((int)(hour * slot), chartBottom + 2, 35, 17), Palette.Muted);
            }
        }
    }

    internal sealed class BlockForm : Form
    {
        private readonly Label title;
        private readonly Label message;
        public event EventHandler BreakRequested;
        public BlockForm()
        {
            Text = "Amythest reminder";
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            TopMost = true;
            BackColor = Palette.Background;
            StartPosition = FormStartPosition.Manual;
            WindowState = FormWindowState.Maximized;
            KeyPreview = true;
            AeroCard card = new AeroCard();
            card.Size = new Size(490, 320);
            Controls.Add(card);
            Resize += delegate { card.Left = (ClientSize.Width - card.Width) / 2; card.Top = (ClientSize.Height - card.Height) / 2; };
            title = Ui.Label("Pause for a moment.", 30, 44, 430, 48, 28, true);
            card.Controls.Add(Ui.Label("AMYTHEST  /  A GENTLE REMINDER", 30, 20, 430, 20, 10, true, Palette.Lilac));
            card.Controls.Add(title);
            message = Ui.Label("", 30, 106, 430, 72, 14, false, Palette.Muted);
            card.Controls.Add(message);
            Button breakButton = Ui.Button("Take a 5-minute break", 30, 220, 430, 48);
            breakButton.Click += delegate { if (BreakRequested != null) BreakRequested(this, EventArgs.Empty); };
            card.Controls.Add(breakButton);
            card.Controls.Add(Ui.Label("This is a self-control pause. You can switch to another app.", 30, 278, 430, 24, 10, false, Palette.Muted));
            Deactivate += delegate { Hide(); };
            KeyDown += delegate(object sender, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) Hide(); };
        }
        public void ShowFor(string app, string reason)
        {
            title.Text = "Hold on, " + app + ".";
            message.Text = reason + " Switch to something that supports what you want to do.";
            if (!Visible) Show();
            BringToFront();
        }
    }

    internal static class Ui
    {
        public static GraphicsPath RoundRect(Rectangle rect, int radius)
        {
            GraphicsPath path = new GraphicsPath();
            int diameter = Math.Min(radius * 2, Math.Min(rect.Width, rect.Height));
            path.AddArc(rect.Left, rect.Top, diameter, diameter, 180, 90);
            path.AddArc(rect.Right - diameter, rect.Top, diameter, diameter, 270, 90);
            path.AddArc(rect.Right - diameter, rect.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(rect.Left, rect.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
        public static GraphicsPath CaptionShape(Rectangle rect, CaptionAction action)
        {
            GraphicsPath path = new GraphicsPath();
            if (action == CaptionAction.Maximize) { path.AddRectangle(rect); return path; }
            int d = 6;
            if (action == CaptionAction.Minimize)
            {
                path.AddArc(rect.Left, rect.Top, d, d, 180, 90);
                path.AddLine(rect.Left + d / 2, rect.Top, rect.Right, rect.Top);
                path.AddLine(rect.Right, rect.Top, rect.Right, rect.Bottom);
                path.AddLine(rect.Right, rect.Bottom, rect.Left + d / 2, rect.Bottom);
                path.AddArc(rect.Left, rect.Bottom - d, d, d, 90, 90);
            }
            else
            {
                path.AddLine(rect.Left, rect.Top, rect.Right - d / 2, rect.Top);
                path.AddArc(rect.Right - d, rect.Top, d, d, 270, 90);
                path.AddLine(rect.Right, rect.Top + d / 2, rect.Right, rect.Bottom - d / 2);
                path.AddArc(rect.Right - d, rect.Bottom - d, d, d, 0, 90);
                path.AddLine(rect.Right - d / 2, rect.Bottom, rect.Left, rect.Bottom);
                path.AddLine(rect.Left, rect.Bottom, rect.Left, rect.Top);
            }
            path.CloseFigure();
            return path;
        }
        public static Label Label(string text, int x, int y, int w, int h, float size, bool bold, Color? color = null)
        {
            return new Label { Text = text, Left = x, Top = y, Width = w, Height = h,
                ForeColor = color ?? Palette.Ink, BackColor = Color.Transparent,
                Font = new Font("Segoe UI", size, bold ? FontStyle.Bold : FontStyle.Regular), TextAlign = ContentAlignment.MiddleLeft };
        }
        public static Button Button(string text, int x, int y, int w, int h)
        {
            return new AeroButton { Text = text, Left = x, Top = y, Width = w, Height = h };
        }
        public static TextBox Input(int x, int y, int w)
        {
            return new TextBox { Left = x, Top = y, Width = w, BorderStyle = BorderStyle.FixedSingle,
                BackColor = Palette.White, ForeColor = Palette.Ink, Font = new Font("Segoe UI", 11) };
        }
    }

    internal sealed class MainForm : Form
    {
        [DllImport("user32.dll")] private static extern bool ReleaseCapture();
        [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr handle, int message, IntPtr wParam, IntPtr lParam);
        private const int WmNcHitTest = 0x84;
        private const int WmNcLButtonDown = 0xA1;
        private const int HtCaption = 2;
        private readonly AeroCaption caption = new AeroCaption();
        private readonly LocalStore store;
        private readonly Settings settings;
        private Dictionary<string, long> usage;
        private long[] hours;
        private DateTime day;
        private DateTime lastTick;
        private int saveTicks;
        private int cloudTicks;
        private int cloudBusy;
        private readonly System.Windows.Forms.Timer timer;
        private readonly BlockForm blocker;
        private readonly NotifyIcon tray;
        private bool quitting;
        private Label totalLabel, distractionLabel, focusLabel;
        private GoalBar goalBar;
        private HourChart hourChart;
        private ListView usageList;
        private ListView websiteList;
        private ListView cloudDeviceList;
        private ListBox cloudSiteLimits;
        private CloudSiteSettings latestSiteSettings;
        private TextBox siteLimitDomain;
        private NumericUpDown siteLimitMinutes;
        private Label bridgeStatus;
        private Label accountStatus;
        private Label accountPageStatus;
        private Label boundaryOverview;
        private Button useCloudLimits;
        private CloudWindowsSettings pendingCloudLimits;
        private ListBox distractionList, limitList;
        private TextBox distractionInput, limitInput;
        private NumericUpDown goalInput, limitMinutes;
        private CheckBox workEnabled;
        private DateTimePicker workStart, workEnd;
        private Button focusButton;

        public MainForm() : this(null) { }

        public MainForm(string previewDataFolder)
        {
            store = new LocalStore(previewDataFolder ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Amythest"));
            settings = store.LoadSettings();
            day = DateTime.Today;
            usage = store.LoadUsage(day);
            hours = store.LoadHours(day);
            lastTick = DateTime.Now;
            Text = "Amythest — screen time for Windows";
            BackColor = Palette.Background;
            ForeColor = Palette.Ink;
            Font = new Font("Segoe UI", 10);
            FormBorderStyle = FormBorderStyle.None;
            Size = new Size(1100, 800);
            MinimumSize = new Size(940, 700);
            StartPosition = FormStartPosition.CenterScreen;
            Load += delegate { MaximizedBounds = Screen.FromHandle(Handle).WorkingArea; };
            string iconPath = Path.Combine(Application.StartupPath, "icon48.png");
            if (File.Exists(iconPath))
            {
                try { using (Bitmap bitmap = new Bitmap(iconPath)) Icon = Icon.FromHandle(bitmap.GetHicon()); }
                catch { }
            }
            BuildUi();
            blocker = new BlockForm();
            blocker.BreakRequested += delegate { settings.PausedUntil = DateTime.Now.AddMinutes(5); Save(); blocker.Hide(); RefreshSummary(); };
            tray = new NotifyIcon { Icon = Icon ?? SystemIcons.Application, Text = "Amythest screen time", Visible = true };
            ContextMenu menu = new ContextMenu();
            menu.MenuItems.Add("Open Amythest", delegate { Show(); WindowState = FormWindowState.Normal; Activate(); });
            menu.MenuItems.Add("Quit", delegate { quitting = true; Close(); });
            tray.ContextMenu = menu;
            tray.DoubleClick += delegate { Show(); WindowState = FormWindowState.Normal; Activate(); };
            FormClosing += delegate(object sender, FormClosingEventArgs e) { if (!quitting) { e.Cancel = true; Hide(); } };
            FormClosed += delegate { Save(); tray.Visible = false; tray.Dispose(); blocker.Dispose(); };
            timer = new System.Windows.Forms.Timer { Interval = 1000 };
            timer.Tick += Tick;
            if (previewDataFolder == null) timer.Start();
            RefreshAll();
            if (previewDataFolder == null) SyncCloud();
        }

        private void BuildUi()
        {
            Controls.Add(caption);
            Label captionTitle = Ui.Label("Amythest — screen time for Windows", 13, 3, 410, 29, 9, false, Color.FromArgb(28, 57, 91));
            caption.Controls.Add(captionTitle);
            MouseEventHandler beginDrag = delegate(object sender, MouseEventArgs e) {
                if (e.Button != MouseButtons.Left || WindowState == FormWindowState.Maximized) return;
                ReleaseCapture();
                SendMessage(Handle, WmNcLButtonDown, (IntPtr)HtCaption, IntPtr.Zero);
            };
            caption.MouseDown += beginDrag;
            captionTitle.MouseDown += beginDrag;
            EventHandler toggleMaximize = delegate {
                WindowState = WindowState == FormWindowState.Maximized ? FormWindowState.Normal : FormWindowState.Maximized;
                caption.MaximizeButton.Invalidate();
            };
            caption.DoubleClick += toggleMaximize;
            captionTitle.DoubleClick += toggleMaximize;
            caption.MinimizeButton.Click += delegate { WindowState = FormWindowState.Minimized; };
            caption.MaximizeButton.Click += toggleMaximize;
            caption.CloseButton.Click += delegate { Close(); };
            GlassStrip header = new GlassStrip();
            Controls.Add(header);
            header.Controls.Add(new LogoMark { Left = 26, Top = 14, Width = 44, Height = 44 });
            header.Controls.Add(Ui.Label("amythest", 79, 14, 330, 32, 19, true, Color.White));
            header.Controls.Add(Ui.Label("See where your time goes.", 26, 59, 650, 38, 25, true, Color.White));
            header.Controls.Add(Ui.Label("Your apps, websites, and focus in one clear view.", 28, 99, 650, 22, 11, false, Color.FromArgb(228, 224, 249)));
            Label edition = Ui.Label("SCREEN TIME DASHBOARD", 0, 25, 210, 20, 9, true, Color.FromArgb(234, 230, 255));
            edition.Anchor = AnchorStyles.Top | AnchorStyles.Right;
            header.Controls.Add(edition);
            header.Resize += delegate { edition.Left = header.ClientSize.Width - 235; };

            AeroCard summary = new AeroCard { Padding = new Padding(24) };
            Controls.Add(summary);
            summary.Controls.Add(Ui.Label("Today in Windows", 27, 17, 240, 23, 12, true, Palette.Lilac));
            totalLabel = Ui.Label("0m", 27, 42, 210, 49, 31, true);
            summary.Controls.Add(totalLabel);
            summary.Controls.Add(Ui.Label("Total app time", 27, 99, 220, 24, 10, false, Palette.Muted));
            summary.Controls.Add(Ui.Label("Distraction budget", 296, 19, 220, 22, 12, true, Palette.Lilac));
            distractionLabel = Ui.Label("0m / 2h", 296, 45, 330, 40, 23, true);
            summary.Controls.Add(distractionLabel);
            goalBar = new GoalBar { Left = 296, Top = 103, Width = 460, Anchor = AnchorStyles.Left | AnchorStyles.Right | AnchorStyles.Top };
            summary.Controls.Add(goalBar);

            GlassStrip footer = new GlassStrip();
            Controls.Add(footer);
            focusButton = Ui.Button("Start 25-minute focus", 24, 14, 270, 44);
            focusButton.Click += delegate { settings.FocusUntil = settings.FocusUntil > DateTime.Now ? DateTime.MinValue : DateTime.Now.AddMinutes(25); settings.PausedUntil = DateTime.MinValue; Save(); RefreshSummary(); };
            focusLabel = Ui.Label("No focus session running", 315, 19, 450, 36, 11, false, Color.FromArgb(236, 231, 252));
            footer.Controls.Add(Ui.Label("Amythest keeps your time in view.", 24, 7, 560, 25, 10, false, Color.FromArgb(236, 231, 252)));

            AeroTabs tabs = new AeroTabs();
            Controls.Add(tabs);
            Action layout = delegate {
                int width = ClientSize.Width;
                int height = ClientSize.Height;
                caption.SetBounds(0, 0, width, 35);
                header.SetBounds(0, 35, width, 132);
                footer.SetBounds(0, height - 36, width, 36);
                tabs.SetBounds(20, 184, width - 40, Math.Max(150, height - 184 - 48));
            };
            Resize += delegate { layout(); };
            layout();
            TabPage todayPage = new TabPage("Today") { BackColor = Palette.Card, ForeColor = Palette.Ink, Padding = new Padding(20) };
            TabPage boundaryPage = new TabPage("Boundaries") { BackColor = Palette.Card, ForeColor = Palette.Ink };
            TabPage websitesPage = new TabPage("Websites") { BackColor = Palette.Card, ForeColor = Palette.Ink, Padding = new Padding(20) };
            TabPage accountPage = new TabPage("Account") { BackColor = Palette.Card, ForeColor = Palette.Ink, Padding = new Padding(20) };
            tabs.TabPages.Add(todayPage);
            tabs.TabPages.Add(websitesPage);
            tabs.TabPages.Add(boundaryPage);
            tabs.TabPages.Add(accountPage);
            todayPage.Controls.Add(summary);
            summary.Controls.Add(Ui.Label("Most used apps", 27, 260, 320, 28, 13, true, Palette.Lilac));
            hourChart = new HourChart { Left = 14, Top = 76, Width = 480, Height = 96, Anchor = AnchorStyles.Top | AnchorStyles.Left };
            hourChart.Hours = hours;
            summary.Controls.Add(hourChart);
            usageList = new ListView { Left = 14, Top = 186, Width = 480, Height = 160, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left,
                View = View.Details, FullRowSelect = true, GridLines = true, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle,
                Font = new Font("Segoe UI", 10) };
            usageList.Columns.Add("App", 170);
            usageList.Columns.Add("Time", 90);
            usageList.Columns.Add("Category", 120);
            summary.Controls.Add(usageList);
            AeroCard focusCard = new AeroCard();
            todayPage.Controls.Add(focusCard);
            focusCard.Controls.Add(Ui.Label("Focus sessions", 20, 17, 320, 28, 15, true, Palette.Lilac));
            focusCard.Controls.Add(Ui.Label("Pause distracting apps while you focus.", 20, 49, 340, 25, 10, false, Palette.Muted));
            focusButton.SetBounds(20, 91, 270, 40);
            focusCard.Controls.Add(focusButton);
            focusLabel.SetBounds(20, 144, 340, 40);
            focusLabel.ForeColor = Palette.Muted;
            focusCard.Controls.Add(focusLabel);
            AeroCard guidanceCard = new AeroCard();
            todayPage.Controls.Add(guidanceCard);
            guidanceCard.Controls.Add(Ui.Label("Your boundaries", 20, 17, 320, 28, 15, true, Palette.Lilac));
            boundaryOverview = Ui.Label("", 20, 55, 350, 150, 11, false, Palette.Muted);
            guidanceCard.Controls.Add(boundaryOverview);
            Button editBoundaries = Ui.Button("Edit app boundaries", 20, 0, 215, 38);
            editBoundaries.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            editBoundaries.Click += delegate { tabs.SelectedTab = boundaryPage; };
            guidanceCard.Controls.Add(editBoundaries);
            guidanceCard.Resize += delegate {
                boundaryOverview.Width = Math.Max(200, guidanceCard.ClientSize.Width - 40);
                editBoundaries.Top = guidanceCard.ClientSize.Height - 57;
            };
            todayPage.Resize += delegate {
                int leftWidth = Math.Max(430, (todayPage.ClientSize.Width - 54) / 2);
                summary.SetBounds(14, 14, leftWidth, Math.Max(200, todayPage.ClientSize.Height - 28));
                goalBar.Width = Math.Max(120, summary.ClientSize.Width - goalBar.Left - 24);
                hourChart.SetBounds(27, 146, Math.Max(180, leftWidth - 54), 112);
                usageList.SetBounds(27, 293, Math.Max(180, leftWidth - 54), Math.Max(70, summary.ClientSize.Height - 317));
                int rightX = 30 + leftWidth;
                int rightWidth = Math.Max(300, todayPage.ClientSize.Width - rightX - 14);
                focusCard.SetBounds(rightX, 14, rightWidth, 190);
                guidanceCard.SetBounds(rightX, 217, rightWidth, Math.Max(115, todayPage.ClientSize.Height - 232));
            };

            websitesPage.Controls.Add(Ui.Label("Chrome website time", 14, 12, 600, 28, 14, true, Palette.Lilac));
            websitesPage.Controls.Add(Ui.Label("Site totals come from the Amythest Chrome extension. Chrome app time stays separate to avoid double counting.", 14, 42, 810, 42, 10, false, Palette.Muted));
            websiteList = new ListView { Left = 14, Top = 88, Width = 830, Height = 200, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                View = View.Details, FullRowSelect = true, GridLines = true, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle,
                Font = new Font("Segoe UI", 10) };
            websiteList.Columns.Add("Website", 280);
            websiteList.Columns.Add("Active", 130);
            websiteList.Columns.Add("Video", 130);
            websiteList.Columns.Add("Distraction", 150);
            websitesPage.Controls.Add(websiteList);
            bridgeStatus = Ui.Label("", 14, 0, 800, 25, 10, false, Palette.Muted);
            bridgeStatus.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            websitesPage.Controls.Add(bridgeStatus);
            TextBox extensionId = Ui.Input(14, 0, 340);
            extensionId.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            extensionId.AccessibleName = "Amythest Chrome extension ID";
            websitesPage.Controls.Add(extensionId);
            Button connectChrome = Ui.Button("Connect Chrome", 366, 0, 160, 34);
            connectChrome.Anchor = AnchorStyles.Left | AnchorStyles.Bottom;
            connectChrome.Click += delegate {
                try {
                    string hostPath = Path.Combine(Application.StartupPath, "Amythest.NativeHost.exe");
                    NativeBridge.Register(extensionId.Text.Trim(), hostPath, NativeBridge.DataFolder);
                    bridgeStatus.Text = "Connected. Reload the extension in chrome://extensions to start syncing.";
                }
                catch (Exception error) { MessageBox.Show(error.Message, "Connect Chrome", MessageBoxButtons.OK, MessageBoxIcon.Warning); }
            };
            websitesPage.Controls.Add(connectChrome);
            accountStatus = Ui.Label("Account sync: sign in through the Chrome extension.", 540, 0, 350, 45, 10, false, Palette.Muted);
            accountStatus.Anchor = AnchorStyles.Right | AnchorStyles.Bottom;
            websitesPage.Controls.Add(accountStatus);
            websitesPage.Resize += delegate {
                int bottom = websitesPage.ClientSize.Height;
                websiteList.Height = Math.Max(90, bottom - 185);
                bridgeStatus.Top = bottom - 82;
                extensionId.Top = bottom - 51;
                connectChrome.Top = bottom - 55;
                accountStatus.SetBounds(Math.Max(540, websitesPage.ClientSize.Width - 370), bottom - 57, 350, 48);
            };
            bridgeStatus.Text = NativeBridge.IsRegistered(NativeBridge.DataFolder) ? "Chrome connected. Site time updates about once a minute." : "To connect, paste the extension ID from chrome://extensions below.";
            accountPage.Controls.Add(Ui.Label("Your Amythest account", 14, 14, 650, 32, 17, true, Palette.Lilac));
            accountPage.Controls.Add(Ui.Label("Create an account or sign in with email and password in the Chrome extension dashboard. This Windows app then joins the account automatically.", 14, 52, 820, 46, 11, false, Palette.Muted));
            accountPageStatus = Ui.Label("Waiting for an account connection.", 14, 107, 570, 34, 11, false, Palette.Ink);
            accountPage.Controls.Add(accountPageStatus);
            useCloudLimits = Ui.Button("Use cloud app limits", 595, 103, 205, 31);
            useCloudLimits.Visible = false;
            useCloudLimits.Click += delegate {
                if (pendingCloudLimits == null) return;
                pendingCloudLimits.Apply(settings);
                goalInput.Value = settings.GoalMinutes;
                workEnabled.Checked = settings.WorkEnabled;
                workStart.Value = DateTime.Today.AddMinutes(settings.WorkStartMinutes);
                workEnd.Value = DateTime.Today.AddMinutes(settings.WorkEndMinutes);
                Save(); RefreshLists(); pendingCloudLimits = null; useCloudLimits.Visible = false;
                accountPageStatus.Text = "Cloud app limits applied.";
            };
            accountPage.Controls.Add(useCloudLimits);
            accountPage.Controls.Add(Ui.Label("Today across your devices", 14, 145, 650, 27, 14, true, Palette.Lilac));
            cloudDeviceList = new ListView { Left = 14, Top = 181, Width = 830, Height = 190, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                View = View.Details, FullRowSelect = true, GridLines = true, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10) };
            cloudDeviceList.Columns.Add("Source", 200);
            cloudDeviceList.Columns.Add("Active", 130);
            cloudDeviceList.Columns.Add("Distraction", 150);
            cloudDeviceList.Columns.Add("Video", 120);
            accountPage.Controls.Add(cloudDeviceList);
            accountPage.Controls.Add(Ui.Label("Chrome website limits", 14, 376, 650, 27, 14, true, Palette.Lilac));
            siteLimitDomain = Ui.Input(14, 409, 220);
            siteLimitDomain.AccessibleName = "Website domain";
            accountPage.Controls.Add(siteLimitDomain);
            siteLimitMinutes = new NumericUpDown { Left = 244, Top = 409, Width = 80, Minimum = 1, Maximum = 1440, Value = 30, BackColor = Palette.White, ForeColor = Palette.Ink };
            accountPage.Controls.Add(siteLimitMinutes);
            Button setSiteLimit = Ui.Button("Set site limit", 335, 405, 145, 34);
            accountPage.Controls.Add(setSiteLimit);
            Button removeSiteLimit = Ui.Button("Remove selected", 491, 405, 165, 34);
            accountPage.Controls.Add(removeSiteLimit);
            Action<string, int, Button> updateSiteLimit = delegate(string domain, int minutes, Button button) {
                if (latestSiteSettings == null) { accountPageStatus.Text = "Sign in and sync Chrome settings first."; return; }
                button.Enabled = false;
                int revision = latestSiteSettings.revision;
                ThreadPool.QueueUserWorkItem(delegate {
                    string error = null;
                    try { new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).SetSiteLimit(domain, minutes, revision); }
                    catch (Exception) { error = "Could not save the site limit. Refresh account sync and try again."; }
                    if (!IsDisposed && IsHandleCreated) BeginInvoke((MethodInvoker)delegate {
                        button.Enabled = true;
                        if (error != null) accountPageStatus.Text = error;
                        else { siteLimitDomain.Clear(); accountPageStatus.Text = "Website limit saved. Syncing across devices…"; SyncCloud(); }
                    });
                });
            };
            setSiteLimit.Click += delegate { updateSiteLimit(siteLimitDomain.Text, (int)siteLimitMinutes.Value, setSiteLimit); };
            removeSiteLimit.Click += delegate {
                if (cloudSiteLimits.SelectedItem == null) return;
                string domain = cloudSiteLimits.SelectedItem.ToString().Split(' ')[0];
                updateSiteLimit(domain, 0, removeSiteLimit);
            };
            cloudSiteLimits = new ListBox { Left = 14, Top = 450, Width = 830, Height = 60, Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle, Font = new Font("Segoe UI", 10) };
            accountPage.Controls.Add(cloudSiteLimits);
            accountPage.Resize += delegate {
                cloudDeviceList.Height = Math.Max(80, (accountPage.ClientSize.Height - 220) / 2);
                Control heading = accountPage.Controls.Cast<Control>().FirstOrDefault(c => c is Label && c.Text == "Chrome website limits");
                if (heading != null) heading.Top = cloudDeviceList.Bottom + 12;
                siteLimitDomain.Top = cloudDeviceList.Bottom + 45;
                siteLimitMinutes.Top = cloudDeviceList.Bottom + 45;
                setSiteLimit.Top = cloudDeviceList.Bottom + 41;
                removeSiteLimit.Top = cloudDeviceList.Bottom + 41;
                cloudSiteLimits.SetBounds(14, cloudDeviceList.Bottom + 86, accountPage.ClientSize.Width - 28, Math.Max(50, accountPage.ClientSize.Height - cloudDeviceList.Bottom - 98));
            };

            boundaryPage.Controls.Add(Ui.Label("Daily distraction goal", 24, 20, 400, 24, 11, true, Palette.Lilac));
            goalInput = new NumericUpDown { Left = 24, Top = 49, Width = 105, Minimum = 1, Maximum = 1440, Value = settings.GoalMinutes, BackColor = Palette.White, ForeColor = Palette.Ink };
            goalInput.ValueChanged += delegate { settings.GoalMinutes = (int)goalInput.Value; Save(); RefreshSummary(); };
            boundaryPage.Controls.Add(goalInput);
            boundaryPage.Controls.Add(Ui.Label("minutes per day", 140, 48, 200, 25, 10, false, Palette.Muted));

            boundaryPage.Controls.Add(Ui.Label("Distracting apps", 24, 92, 400, 24, 11, true, Palette.Lilac));
            boundaryPage.Controls.Add(Ui.Label("Use an app's process name, such as discord.exe. These apps count toward the goal and pause during focus or work hours.", 24, 118, 760, 40, 10, false, Palette.Muted));
            distractionInput = Ui.Input(24, 163, 225);
            boundaryPage.Controls.Add(distractionInput);
            Button addDistraction = Ui.Button("Add app", 260, 158, 110, 34);
            addDistraction.Click += delegate { string app = AppPolicy.NormalizeApp(distractionInput.Text); if (!AppPolicy.CanBlock(app)) { MessageBox.Show("Enter a valid app process name. Windows system apps cannot be blocked."); return; } settings.DistractingApps.Add(app); distractionInput.Clear(); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(addDistraction);
            distractionList = new ListBox { Left = 24, Top = 205, Width = 345, Height = 88, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle };
            boundaryPage.Controls.Add(distractionList);
            Button removeDistraction = Ui.Button("Remove selected", 382, 205, 160, 34);
            removeDistraction.Click += delegate { if (distractionList.SelectedItem == null) return; settings.DistractingApps.Remove(distractionList.SelectedItem.ToString()); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(removeDistraction);

            boundaryPage.Controls.Add(Ui.Label("Daily app limits", 24, 313, 400, 24, 11, true, Palette.Lilac));
            limitInput = Ui.Input(24, 343, 225);
            boundaryPage.Controls.Add(limitInput);
            limitMinutes = new NumericUpDown { Left = 260, Top = 343, Width = 95, Minimum = 1, Maximum = 1440, Value = 30, BackColor = Palette.White, ForeColor = Palette.Ink };
            boundaryPage.Controls.Add(limitMinutes);
            Button addLimit = Ui.Button("Set limit", 366, 338, 117, 34);
            addLimit.Click += delegate { string app = AppPolicy.NormalizeApp(limitInput.Text); if (!AppPolicy.CanBlock(app)) { MessageBox.Show("Enter a valid app process name. Windows system apps cannot be blocked."); return; } settings.DailyLimits[app] = (int)limitMinutes.Value; limitInput.Clear(); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(addLimit);
            limitList = new ListBox { Left = 24, Top = 387, Width = 345, Height = 82, BackColor = Palette.White, ForeColor = Palette.Ink, BorderStyle = BorderStyle.FixedSingle };
            boundaryPage.Controls.Add(limitList);
            Button removeLimit = Ui.Button("Remove selected", 382, 387, 160, 34);
            removeLimit.Click += delegate { if (limitList.SelectedItem == null) return; string key = limitList.SelectedItem.ToString().Split(' ')[0]; settings.DailyLimits.Remove(key); Save(); RefreshLists(); };
            boundaryPage.Controls.Add(removeLimit);

            boundaryPage.Controls.Add(Ui.Label("Work hours", 24, 485, 400, 24, 11, true, Palette.Lilac));
            workEnabled = new CheckBox { Text = "Pause distracting apps on weekdays", Left = 24, Top = 516, Width = 350, Height = 27, ForeColor = Palette.Ink, Checked = settings.WorkEnabled };
            workEnabled.CheckedChanged += delegate { settings.WorkEnabled = workEnabled.Checked; Save(); };
            boundaryPage.Controls.Add(workEnabled);
            workStart = TimePicker(settings.WorkStartMinutes, 24, 552);
            workEnd = TimePicker(settings.WorkEndMinutes, 184, 552);
            workStart.ValueChanged += delegate { settings.WorkStartMinutes = workStart.Value.Hour * 60 + workStart.Value.Minute; Save(); };
            workEnd.ValueChanged += delegate { settings.WorkEndMinutes = workEnd.Value.Hour * 60 + workEnd.Value.Minute; Save(); };
            boundaryPage.Controls.Add(workStart); boundaryPage.Controls.Add(workEnd);
            boundaryPage.Controls.Add(Ui.Label("to", 148, 553, 30, 27, 10, false, Palette.Muted));
            // Keep settings in two scan-friendly columns. The page itself scrolls
            // only when the window is too short to show both columns completely.
            Panel leftSettings = new AeroCard();
            Panel rightSettings = new AeroCard();
            List<Control> settingsControls = boundaryPage.Controls.Cast<Control>().ToList();
            foreach (Control control in settingsControls)
            {
                if (control.Top < 300) leftSettings.Controls.Add(control);
                else { control.Top -= 300; rightSettings.Controls.Add(control); }
            }
            boundaryPage.Controls.Add(leftSettings);
            boundaryPage.Controls.Add(rightSettings);
            VScrollBar settingsScroll = new VScrollBar();
            boundaryPage.Controls.Add(settingsScroll);
            foreach (Control control in leftSettings.Controls)
                if (control is Label && control.Width > 500) control.Width = 350;
            distractionList.SetBounds(24, 205, 345, 64);
            removeDistraction.SetBounds(24, 276, 160, 31);
            limitInput.SetBounds(24, 53, 180, 27);
            limitMinutes.SetBounds(213, 53, 70, 27);
            addLimit.SetBounds(294, 49, 80, 33);
            limitList.SetBounds(24, 99, 345, 68);
            removeLimit.SetBounds(24, 174, 160, 31);
            foreach (Control control in rightSettings.Controls)
            {
                if (control is Label && control.Width > 500) control.Width = 350;
                if (control is Label && control.Text == "Work hours") control.Top = 217;
                if (control is Label && control.Text == "to") control.Top = 281;
            }
            workEnabled.SetBounds(24, 244, 350, 27);
            workStart.SetBounds(24, 279, 120, 24);
            workEnd.SetBounds(184, 279, 120, 24);
            Action layoutSettings = delegate {
                int gap = 16;
                int columnWidth = Math.Max(370, (boundaryPage.ClientSize.Width - 96 - gap) / 2);
                int viewport = boundaryPage.ClientSize.Height;
                int maximum = Math.Max(0, 340 - viewport);
                settingsScroll.Visible = maximum > 0;
                settingsScroll.SetBounds(boundaryPage.ClientSize.Width - settingsScroll.Width, 0, settingsScroll.Width, viewport);
                settingsScroll.LargeChange = Math.Max(1, viewport);
                settingsScroll.Maximum = maximum + settingsScroll.LargeChange - 1;
                if (settingsScroll.Value > maximum) settingsScroll.Value = maximum;
                leftSettings.SetBounds(18, 8 - settingsScroll.Value, columnWidth, 322);
                rightSettings.SetBounds(18 + columnWidth + gap, 8 - settingsScroll.Value, columnWidth, 322);
            };
            settingsScroll.Scroll += delegate { layoutSettings(); };
            boundaryPage.MouseWheel += delegate(object sender, MouseEventArgs e) {
                int maximum = Math.Max(0, 340 - boundaryPage.ClientSize.Height);
                settingsScroll.Value = Math.Max(0, Math.Min(maximum, settingsScroll.Value - Math.Sign(e.Delta) * 30));
                layoutSettings();
            };
            boundaryPage.Resize += delegate { layoutSettings(); };
            layoutSettings();
        }

        protected override void WndProc(ref Message message)
        {
            if (message.Msg == WmNcHitTest && WindowState != FormWindowState.Maximized)
            {
                Point point = PointToClient(new Point((short)(message.LParam.ToInt64() & 0xFFFF), (short)((message.LParam.ToInt64() >> 16) & 0xFFFF)));
                int edge = 7;
                bool left = point.X < edge, right = point.X >= ClientSize.Width - edge;
                bool top = point.Y < edge, bottom = point.Y >= ClientSize.Height - edge;
                if (top && left) { message.Result = (IntPtr)13; return; }
                if (top && right) { message.Result = (IntPtr)14; return; }
                if (bottom && left) { message.Result = (IntPtr)16; return; }
                if (bottom && right) { message.Result = (IntPtr)17; return; }
                if (left) { message.Result = (IntPtr)10; return; }
                if (right) { message.Result = (IntPtr)11; return; }
                if (top) { message.Result = (IntPtr)12; return; }
                if (bottom) { message.Result = (IntPtr)15; return; }
            }
            base.WndProc(ref message);
        }

        private static DateTimePicker TimePicker(int minutes, int x, int y)
        {
            return new DateTimePicker { Left = x, Top = y, Width = 120, Format = DateTimePickerFormat.Custom, CustomFormat = "h:mm tt", ShowUpDown = true,
                Value = DateTime.Today.AddMinutes(minutes) };
        }

        private void Tick(object sender, EventArgs e)
        {
            DateTime now = DateTime.Now;
            if (now.Date != day.Date) { store.SaveUsage(day, usage); store.SaveHours(day, hours); day = now.Date; usage = store.LoadUsage(day); hours = store.LoadHours(day); hourChart.Hours = hours; }
            long elapsed = Math.Max(0, Math.Min(1500, (long)(now - lastTick).TotalMilliseconds));
            lastTick = now;
            string app = ForegroundApp.IsIdle(60) ? null : ForegroundApp.CurrentName();
            if (app != null && app != "amythest")
            {
                long current;
                usage.TryGetValue(app, out current);
                usage[app] = current + elapsed;
                hours[now.Hour] = Math.Min(3600000, hours[now.Hour] + elapsed);
                string reason = AppPolicy.BlockReason(app, usage[app], settings, now, settings.FocusUntil, settings.PausedUntil);
                if (reason != null && !blocker.Visible) blocker.ShowFor(app, reason);
            }
            if (++saveTicks >= 10) { saveTicks = 0; store.SaveUsage(day, usage); store.SaveHours(day, hours); RefreshWebsites(); hourChart.Hours = hours; }
            if (++cloudTicks >= 60) { cloudTicks = 0; SyncCloud(); }
            RefreshSummary();
            if (Visible) RefreshToday();
        }

        private static string TimeText(long ms)
        {
            long minutes = ms / 60000;
            if (minutes < 60) return minutes + "m";
            long remainder = minutes % 60;
            return (minutes / 60) + "h" + (remainder == 0 ? "" : " " + remainder + "m");
        }
        private void RefreshAll() { RefreshSummary(); RefreshToday(); RefreshWebsites(); RefreshLists(); }
        private void RefreshSummary()
        {
            long total = usage.Values.Sum();
            long distracting = usage.Where(x => settings.DistractingApps.Contains(x.Key)).Sum(x => x.Value);
            totalLabel.Text = TimeText(total);
            distractionLabel.Text = TimeText(distracting) + " / " + TimeText((long)settings.GoalMinutes * 60000);
            goalBar.Fraction = (double)distracting / ((long)settings.GoalMinutes * 60000);
            if (settings.FocusUntil > DateTime.Now)
            {
                focusButton.Text = "End focus session";
                focusLabel.Text = "Focus ends at " + settings.FocusUntil.ToString("h:mm tt");
            }
            else { focusButton.Text = "Start a 25-minute focus session"; focusLabel.Text = "No focus session running"; }
        }
        private void RefreshToday()
        {
            usageList.BeginUpdate();
            usageList.Items.Clear();
            foreach (KeyValuePair<string, long> row in usage.OrderByDescending(x => x.Value).Take(80))
            {
                ListViewItem item = new ListViewItem(row.Key + ".exe");
                item.SubItems.Add(TimeText(row.Value));
                item.SubItems.Add(settings.DistractingApps.Contains(row.Key) ? "Distraction" : "Other app");
                usageList.Items.Add(item);
            }
            usageList.EndUpdate();
        }
        private void RefreshWebsites()
        {
            if (websiteList == null) return;
            WebsiteSnapshot snapshot = NativeBridge.LoadSnapshot(DateTime.Today, NativeBridge.DataFolder);
            websiteList.BeginUpdate();
            websiteList.Items.Clear();
            if (snapshot != null)
            {
                foreach (WebsiteRow row in snapshot.sites.OrderByDescending(x => x.activeMs).Take(200))
                {
                    ListViewItem item = new ListViewItem(row.domain);
                    item.SubItems.Add(TimeText(row.activeMs));
                    item.SubItems.Add(TimeText(row.videoMs));
                    item.SubItems.Add(TimeText(row.distractionMs));
                    websiteList.Items.Add(item);
                }
            }
            websiteList.EndUpdate();
        }
        private void SyncCloud()
        {
            if (Interlocked.Exchange(ref cloudBusy, 1) != 0) return;
            DateTime snapshotDate = day;
            Dictionary<string, long> appUsage = new Dictionary<string, long>(usage);
            Settings syncSettings = new Settings();
            CloudWindowsSettings.From(settings).Apply(syncSettings);
            syncSettings.CloudRevision = settings.CloudRevision;
            syncSettings.CloudFingerprint = settings.CloudFingerprint;
            ThreadPool.QueueUserWorkItem(delegate {
                CloudSyncResult result = new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).SyncToday(snapshotDate, appUsage, syncSettings);
                if (!IsDisposed && IsHandleCreated) BeginInvoke((MethodInvoker)delegate {
                    int otherDevices = result.Days == null ? 0 : result.Days.Count(item => item.source == "chrome" || item.deviceId != new CloudSync(NativeBridge.DataFolder, new ConvexTransport()).DeviceId());
                    accountStatus.Text = result.Message + (result.Connected ? " " + otherDevices + " other source" + (otherDevices == 1 ? "" : "s") + " today." : "");
                    accountPageStatus.Text = result.Message;
                    if (result.SettingsConflict) { pendingCloudLimits = result.WindowsSettings; useCloudLimits.Visible = true; }
                    else { pendingCloudLimits = null; useCloudLimits.Visible = false; }
                    if (!result.SettingsConflict && result.WindowsSettings != null && (settings.CloudRevision != result.WindowsSettings.revision || settings.CloudFingerprint != CloudWindowsSettings.Fingerprint(result.WindowsSettings))) {
                        result.WindowsSettings.Apply(settings);
                        goalInput.Value = settings.GoalMinutes;
                        workEnabled.Checked = settings.WorkEnabled;
                        workStart.Value = DateTime.Today.AddMinutes(settings.WorkStartMinutes);
                        workEnd.Value = DateTime.Today.AddMinutes(settings.WorkEndMinutes);
                        Save(); RefreshLists();
                    }
                    cloudSiteLimits.Items.Clear();
                    latestSiteSettings = result.SiteSettings;
                    if (result.SiteSettings != null && result.SiteSettings.siteLimits != null)
                        foreach (CloudSiteLimit limit in result.SiteSettings.siteLimits.OrderBy(x => x.domain))
                            cloudSiteLimits.Items.Add(limit.domain + " · " + limit.minutes + " min/day");
                    cloudDeviceList.BeginUpdate();
                    cloudDeviceList.Items.Clear();
                    if (result.Days != null) foreach (CloudDay entry in result.Days.OrderByDescending(item => item.activeMs)) {
                        string source = entry.source == "chrome" ? "Chrome" : "Windows";
                        string device = entry.deviceId == null ? "" : entry.deviceId.Substring(0, Math.Min(6, entry.deviceId.Length));
                        ListViewItem row = new ListViewItem(source + " " + device);
                        row.SubItems.Add(TimeText(entry.activeMs));
                        row.SubItems.Add(TimeText(entry.distractionMs));
                        row.SubItems.Add(TimeText(entry.videoMs));
                        cloudDeviceList.Items.Add(row);
                    }
                    cloudDeviceList.EndUpdate();
                });
                Interlocked.Exchange(ref cloudBusy, 0);
            });
        }
        private void RefreshLists()
        {
            distractionList.Items.Clear();
            foreach (string app in settings.DistractingApps.OrderBy(x => x)) distractionList.Items.Add(app);
            limitList.Items.Clear();
            foreach (KeyValuePair<string, int> pair in settings.DailyLimits.OrderBy(x => x.Key)) limitList.Items.Add(pair.Key + " · " + pair.Value + " min/day");
            if (boundaryOverview != null) boundaryOverview.Text =
                settings.DistractingApps.Count + " distracting app" + (settings.DistractingApps.Count == 1 ? "" : "s") + "\n" +
                settings.DailyLimits.Count + " daily app limit" + (settings.DailyLimits.Count == 1 ? "" : "s") + "\n" +
                (settings.WorkEnabled ? "Work hours are on" : "Work hours are off") + "\n\n" +
                "Chrome website limits are shown in Account.";
            RefreshSummary(); RefreshToday();
        }
        private void Save() { store.SaveSettings(settings); store.SaveUsage(day, usage); store.SaveHours(day, hours); }
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
